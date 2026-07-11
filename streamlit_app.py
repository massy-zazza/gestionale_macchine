from __future__ import annotations

import hmac
import os
from datetime import date, datetime
from typing import Any

import pandas as pd
import plotly.express as px
import streamlit as st
from supabase import Client, create_client


st.set_page_config(page_title="Gestionale Macchine", page_icon="auto", layout="wide")


def get_secret(name: str) -> str:
    return st.secrets.get(name) or os.environ.get(name, "")


def cents_to_euro(cents: int | float | None) -> float:
    return float(cents or 0) / 100


def euro_to_cents(value: float | int) -> int:
    return int(round(float(value) * 100))


def liters_to_ml(value: float | int) -> int:
    return int(round(float(value) * 1000))


def price_to_milli_cents(value: float | int) -> int:
    return int(round(float(value) * 100000))


def money(cents: int | float | None) -> str:
    return f"EUR {cents_to_euro(cents):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def check_password() -> bool:
    expected = get_secret("APP_PASSWORD")
    if not expected:
        st.error("Configura APP_PASSWORD nei secrets di Streamlit.")
        return False
    if st.session_state.get("authenticated"):
        return True
    st.title("Gestionale Macchine")
    password = st.text_input("Password", type="password")
    if st.button("Entra", type="primary"):
        if hmac.compare_digest(password, expected):
            st.session_state["authenticated"] = True
            st.rerun()
        st.error("Password non valida.")
    return False


@st.cache_resource
def supabase_client() -> Client:
    url = get_secret("SUPABASE_URL")
    key = get_secret("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        st.error("Configura SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nei secrets di Streamlit.")
        st.stop()
    return create_client(url, key)


def rows(name: str) -> list[dict[str, Any]]:
    return supabase_client().table(name).select("*").execute().data or []


@st.cache_data(ttl=20)
def load_data() -> dict[str, pd.DataFrame]:
    names = [
        "vehicles",
        "expense_categories",
        "refuels",
        "expenses",
        "maintenances",
        "mileage_records",
        "reminders",
    ]
    return {name: pd.DataFrame(rows(name)) for name in names}


def insert(table: str, payload: dict[str, Any]) -> dict[str, Any] | None:
    result = supabase_client().table(table).insert(payload).execute().data
    st.cache_data.clear()
    return result[0] if result else None


def update_vehicle_mileage(vehicle_id: str, odometer_km: int) -> None:
    supabase_client().table("vehicles").update({"current_mileage_km": odometer_km}).eq("id", vehicle_id).execute()


def active_vehicle(data: dict[str, pd.DataFrame]) -> dict[str, Any] | None:
    vehicles = data["vehicles"]
    if vehicles.empty:
        return None
    active = vehicles[vehicles["is_active"] == True]
    row = active.iloc[0] if not active.empty else vehicles.iloc[0]
    return row.to_dict()


def validate_mileage(data: dict[str, pd.DataFrame], vehicle_id: str, odometer_km: int) -> str | None:
    mileage = data["mileage_records"]
    if mileage.empty:
        return None
    vehicle_rows = mileage[mileage["vehicle_id"] == vehicle_id]
    if vehicle_rows.empty:
        return None
    last = int(vehicle_rows["odometer_km"].max())
    if odometer_km < last:
        return "Il chilometraggio e inferiore all'ultima rilevazione."
    return None


def consumption_intervals(refuels: pd.DataFrame) -> list[dict[str, float]]:
    if refuels.empty:
        return []
    sorted_rows = refuels.sort_values("odometer_km").to_dict("records")
    previous_full = None
    intervals: list[dict[str, float]] = []
    for row in sorted_rows:
        if previous_full is None:
            if row.get("full_tank"):
                previous_full = row
            continue
        km = int(row["odometer_km"]) - int(previous_full["odometer_km"])
        liters = int(row["liters_ml"]) / 1000
        if km > 0 and liters > 0:
            intervals.append(
                {
                    "km": km,
                    "liters": liters,
                    "km_l": km / liters,
                    "l_100": (liters / km) * 100,
                    "estimate": not bool(row.get("full_tank")),
                }
            )
        if row.get("full_tank"):
            previous_full = row
    return intervals


def weighted_km_l(intervals: list[dict[str, float]]) -> float:
    valid = [row for row in intervals if not row["estimate"]]
    km = sum(row["km"] for row in valid)
    liters = sum(row["liters"] for row in valid)
    return km / liters if km > 0 and liters > 0 else 0


def prepare_dates(df: pd.DataFrame, column: str = "date") -> pd.DataFrame:
    if df.empty or column not in df:
        return df
    out = df.copy()
    out[column] = pd.to_datetime(out[column], utc=True)
    return out


def dashboard(data: dict[str, pd.DataFrame]) -> None:
    refuels = prepare_dates(data["refuels"])
    expenses = prepare_dates(data["expenses"])
    maintenances = prepare_dates(data["maintenances"])
    categories = data["expense_categories"]

    now = pd.Timestamp.now(tz="UTC")
    fuel_total = int(refuels["total_cents"].sum()) if not refuels.empty else 0
    expense_total = int(expenses["amount_cents"].sum()) if not expenses.empty else 0
    maintenance_total = int(maintenances["cost_cents"].sum()) if not maintenances.empty else 0
    all_total = fuel_total + expense_total + maintenance_total

    month_total = sum_month(refuels, "total_cents", now) + sum_month(expenses, "amount_cents", now) + sum_month(maintenances, "cost_cents", now)
    year_total = sum_year(refuels, "total_cents", now) + sum_year(expenses, "amount_cents", now) + sum_year(maintenances, "cost_cents", now)
    intervals = consumption_intervals(refuels)
    km_l = weighted_km_l(intervals)
    latest_km = int(data["mileage_records"]["odometer_km"].max()) if not data["mileage_records"].empty else 0
    avg_price = refuels["price_per_liter_milli_cents"].mean() / 100000 if not refuels.empty else 0
    total_km = sum(row["km"] for row in intervals)
    cost_km = cents_to_euro(all_total) / total_km if total_km else 0

    cols = st.columns(5)
    cols[0].metric("Spesa anno", money(year_total))
    cols[1].metric("Spesa mese", money(month_total))
    cols[2].metric("Carburante", money(fuel_total))
    cols[3].metric("Consumo medio", f"{km_l:.1f} km/l")
    cols[4].metric("Ultimo km", f"{latest_km:,.0f}".replace(",", "."))

    cols = st.columns(5)
    cols[0].metric("Totale storico", money(all_total))
    cols[1].metric("Costo/km", f"EUR {cost_km:.2f}")
    cols[2].metric("l/100 km", f"{(100 / km_l if km_l else 0):.1f}")
    cols[3].metric("Prezzo medio", f"EUR {avg_price:.3f}/l")
    cols[4].metric("Manutenzioni", money(maintenance_total))

    left, right = st.columns(2)
    with left:
        st.subheader("Spese per categoria")
        category_df = category_totals(refuels, expenses, maintenances, categories)
        if not category_df.empty:
            st.plotly_chart(px.pie(category_df, names="categoria", values="euro"), width="stretch")
        else:
            st.info("Nessun dato.")
    with right:
        st.subheader("Spese mensili")
        monthly = monthly_costs(refuels, expenses, maintenances)
        if not monthly.empty:
            st.plotly_chart(px.bar(monthly, x="mese", y=["totale", "carburante"], barmode="group"), width="stretch")
        else:
            st.info("Nessun dato.")

    st.subheader("Prezzo carburante")
    if not refuels.empty:
        price = refuels.copy()
        price["mese"] = price["date"].dt.strftime("%Y-%m")
        price = price.groupby("mese", as_index=False).agg(prezzo=("price_per_liter_milli_cents", lambda s: s.mean() / 100000))
        st.plotly_chart(px.line(price, x="mese", y="prezzo", markers=True), width="stretch")


def sum_month(df: pd.DataFrame, column: str, now: pd.Timestamp) -> int:
    if df.empty:
        return 0
    return int(df.loc[(df["date"].dt.month == now.month) & (df["date"].dt.year == now.year), column].sum())


def sum_year(df: pd.DataFrame, column: str, now: pd.Timestamp) -> int:
    if df.empty:
        return 0
    return int(df.loc[df["date"].dt.year == now.year, column].sum())


def category_totals(refuels: pd.DataFrame, expenses: pd.DataFrame, maintenances: pd.DataFrame, categories: pd.DataFrame) -> pd.DataFrame:
    rows_data = []
    if not expenses.empty and not categories.empty:
        merged = expenses.merge(categories[["id", "name"]], left_on="category_id", right_on="id", how="left")
        for name, group in merged.groupby("name"):
            rows_data.append({"categoria": name or "altre spese", "euro": cents_to_euro(group["amount_cents"].sum())})
    if not refuels.empty:
        rows_data.append({"categoria": "carburante", "euro": cents_to_euro(refuels["total_cents"].sum())})
    if not maintenances.empty:
        rows_data.append({"categoria": "manutenzione", "euro": cents_to_euro(maintenances["cost_cents"].sum())})
    return pd.DataFrame(rows_data)


def monthly_costs(refuels: pd.DataFrame, expenses: pd.DataFrame, maintenances: pd.DataFrame) -> pd.DataFrame:
    frames = []
    for df, amount, kind in [(refuels, "total_cents", "carburante"), (expenses, "amount_cents", "spese"), (maintenances, "cost_cents", "manutenzione")]:
        if df.empty:
            continue
        temp = df.copy()
        temp["mese"] = temp["date"].dt.strftime("%Y-%m")
        temp["kind"] = kind
        temp["euro"] = temp[amount] / 100
        frames.append(temp[["mese", "kind", "euro"]])
    if not frames:
        return pd.DataFrame()
    combined = pd.concat(frames)
    pivot = combined.pivot_table(index="mese", columns="kind", values="euro", aggfunc="sum", fill_value=0).reset_index()
    pivot["totale"] = pivot.drop(columns=["mese"]).sum(axis=1)
    if "carburante" not in pivot:
        pivot["carburante"] = 0
    return pivot.sort_values("mese")


def refuels_page(data: dict[str, pd.DataFrame], vehicle: dict[str, Any]) -> None:
    st.subheader("Nuovo rifornimento")
    with st.form("refuel_form"):
        c1, c2, c3, c4 = st.columns(4)
        refuel_date = c1.date_input("Data", date.today())
        odometer = c2.number_input("Chilometraggio", min_value=1, step=1)
        liters = c3.number_input("Litri", min_value=0.1, step=0.1)
        total = c4.number_input("Importo EUR", min_value=0.01, step=0.01)
        c1, c2, c3, c4 = st.columns(4)
        default_price = max(0.2, float(total / liters if liters else 1.8))
        price = c1.number_input("Prezzo/l", min_value=0.2, value=default_price, step=0.001, format="%.3f")
        station = c2.text_input("Distributore")
        location = c3.text_input("Localita")
        full_tank = c4.checkbox("Pieno completo", value=True)
        notes = st.text_input("Note")
        if st.form_submit_button("Salva rifornimento", type="primary"):
            error = validate_mileage(data, vehicle["id"], int(odometer))
            if error:
                st.error(error)
            else:
                payload = {
                    "vehicle_id": vehicle["id"],
                    "date": datetime.combine(refuel_date, datetime.min.time()).isoformat(),
                    "odometer_km": int(odometer),
                    "liters_ml": liters_to_ml(liters),
                    "total_cents": euro_to_cents(total),
                    "price_per_liter_milli_cents": price_to_milli_cents(price),
                    "fuel_type": vehicle.get("fuel_type", "BENZINA"),
                    "station": station,
                    "location": location,
                    "full_tank": full_tank,
                    "notes": notes,
                }
                insert("refuels", payload)
                insert("mileage_records", {"vehicle_id": vehicle["id"], "date": payload["date"], "odometer_km": int(odometer), "source": "RIFORNIMENTO"})
                update_vehicle_mileage(vehicle["id"], int(odometer))
                st.success("Rifornimento salvato.")
                st.rerun()
    show_table(data["refuels"], {"total_cents": "money", "liters_ml": "liters"})


def expenses_page(data: dict[str, pd.DataFrame], vehicle: dict[str, Any]) -> None:
    categories = data["expense_categories"]
    st.subheader("Nuova spesa")
    with st.form("expense_form"):
        c1, c2, c3, c4 = st.columns(4)
        expense_date = c1.date_input("Data", date.today(), key="expense_date")
        category_name = c2.selectbox("Categoria", categories["name"].tolist() if not categories.empty else ["altre spese"])
        description = c3.text_input("Descrizione")
        amount = c4.number_input("Importo EUR", min_value=0.01, step=0.01)
        supplier = st.text_input("Fornitore")
        notes = st.text_input("Note", key="expense_notes")
        if st.form_submit_button("Salva spesa", type="primary"):
            category_id = categories.loc[categories["name"] == category_name, "id"].iloc[0]
            insert("expenses", {
                "vehicle_id": vehicle["id"],
                "category_id": category_id,
                "date": datetime.combine(expense_date, datetime.min.time()).isoformat(),
                "description": description,
                "amount_cents": euro_to_cents(amount),
                "supplier": supplier,
                "notes": notes,
            })
            st.success("Spesa salvata.")
            st.rerun()
    show_table(data["expenses"], {"amount_cents": "money"})


def maintenance_page(data: dict[str, pd.DataFrame], vehicle: dict[str, Any]) -> None:
    st.subheader("Nuova manutenzione")
    with st.form("maintenance_form"):
        c1, c2, c3, c4 = st.columns(4)
        maintenance_date = c1.date_input("Data", date.today(), key="maintenance_date")
        odometer = c2.number_input("Chilometraggio", min_value=1, step=1, key="maintenance_km")
        kind = c3.text_input("Tipo", value="tagliando")
        cost = c4.number_input("Costo EUR", min_value=0.0, step=0.01)
        description = st.text_input("Descrizione", key="maintenance_desc")
        workshop = st.text_input("Officina")
        if st.form_submit_button("Salva manutenzione", type="primary"):
            error = validate_mileage(data, vehicle["id"], int(odometer))
            if error:
                st.error(error)
            else:
                payload = {
                    "vehicle_id": vehicle["id"],
                    "date": datetime.combine(maintenance_date, datetime.min.time()).isoformat(),
                    "odometer_km": int(odometer),
                    "type": kind,
                    "description": description,
                    "workshop": workshop,
                    "cost_cents": euro_to_cents(cost),
                }
                insert("maintenances", payload)
                insert("mileage_records", {"vehicle_id": vehicle["id"], "date": payload["date"], "odometer_km": int(odometer), "source": "MANUTENZIONE"})
                update_vehicle_mileage(vehicle["id"], int(odometer))
                st.success("Manutenzione salvata.")
                st.rerun()
    show_table(data["maintenances"], {"cost_cents": "money"})


def reminders_page(data: dict[str, pd.DataFrame], vehicle: dict[str, Any]) -> None:
    st.subheader("Nuova scadenza")
    with st.form("reminder_form"):
        c1, c2, c3, c4 = st.columns(4)
        title = c1.text_input("Titolo")
        due_date = c2.date_input("Scadenza", date.today())
        due_km = c3.number_input("Km scadenza", min_value=0, step=100)
        expected = c4.number_input("Importo previsto EUR", min_value=0.0, step=0.01)
        status = st.selectbox("Stato", ["FUTURA", "PROSSIMA", "SCADUTA", "COMPLETATA"])
        if st.form_submit_button("Salva scadenza", type="primary"):
            insert("reminders", {
                "vehicle_id": vehicle["id"],
                "title": title,
                "due_date": due_date.isoformat(),
                "due_mileage_km": int(due_km) if due_km else None,
                "expected_cents": euro_to_cents(expected) if expected else None,
                "status": status,
            })
            st.success("Scadenza salvata.")
            st.rerun()
    show_table(data["reminders"], {"expected_cents": "money"})


def settings_page(data: dict[str, pd.DataFrame]) -> None:
    st.subheader("Veicoli")
    show_table(data["vehicles"], {"purchase_price_cents": "money"})
    with st.form("vehicle_form"):
        c1, c2, c3, c4 = st.columns(4)
        make = c1.text_input("Marca")
        model = c2.text_input("Modello")
        plate = c3.text_input("Targa")
        fuel_type = c4.selectbox("Alimentazione", ["BENZINA", "DIESEL", "GPL", "METANO", "ELETTRICO", "IBRIDO"])
        if st.form_submit_button("Aggiungi auto"):
            insert("vehicles", {"make": make, "model": model, "plate": plate, "fuel_type": fuel_type, "is_active": data["vehicles"].empty})
            st.rerun()


def show_table(df: pd.DataFrame, format_cols: dict[str, str]) -> None:
    if df.empty:
        st.info("Nessun dato.")
        return
    view = df.copy()
    for col, kind in format_cols.items():
        if col not in view:
            continue
        if kind == "money":
            view[col] = view[col].map(money)
        if kind == "liters":
            view[col] = view[col].map(lambda value: f"{int(value) / 1000:.2f}")
    st.dataframe(view, width="stretch", hide_index=True)


def main() -> None:
    if not check_password():
        return
    st.title("Gestionale Macchine")
    data = load_data()
    vehicle = active_vehicle(data)
    if not vehicle:
        st.warning("Nessun veicolo configurato. Esegui supabase/seed.sql oppure aggiungi un veicolo.")
        settings_page(data)
        return
    st.sidebar.success(f"Auto attiva: {vehicle['make']} {vehicle['model']}")
    page = st.sidebar.radio("Navigazione", ["Dashboard", "Rifornimenti", "Spese", "Manutenzioni", "Scadenze", "Impostazioni"])
    if page == "Dashboard":
        dashboard(data)
    elif page == "Rifornimenti":
        refuels_page(data, vehicle)
    elif page == "Spese":
        expenses_page(data, vehicle)
    elif page == "Manutenzioni":
        maintenance_page(data, vehicle)
    elif page == "Scadenze":
        reminders_page(data, vehicle)
    else:
        settings_page(data)


if __name__ == "__main__":
    main()
