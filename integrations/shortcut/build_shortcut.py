"""Generate a native, cross-device shortcut; keep its insert-only key out of Git."""
import hashlib
import json
import os
from pathlib import Path
import plistlib
import secrets
import uuid

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "output" / "shortcuts"
OUT.mkdir(parents=True, exist_ok=True)
secret_path = OUT / "garage-key.txt"
if not secret_path.exists():
    secret_path.write_text(secrets.token_hex(32))
os.chmod(secret_path, 0o600)
token = secret_path.read_text().strip()
endpoint = "https://sdnaklfwknantaubfeys.supabase.co/functions/v1/garage-shortcut"
actions = []

def action(name, **params):
    uid = str(uuid.uuid4()).upper()
    params["UUID"] = uid
    actions.append({"WFWorkflowActionIdentifier": "is.workflow.actions." + name,
                    "WFWorkflowActionParameters": params})
    return {"Type": "ActionOutput", "OutputUUID": uid,
            "OutputName": params.get("CustomOutputName", "Risultato")}

def variable(value):
    return {"WFSerializationType": "WFTextTokenAttachment", "Value": value}

def text(value):
    if isinstance(value, dict):
        content = {"string": "\ufffc", "attachmentsByRange": {"{0, 1}": value}}
    else:
        content = {"string": str(value)}
    return {"WFSerializationType": "WFTextTokenString", "Value": content}

def dictionary(values):
    return {"WFSerializationType": "WFDictionaryFieldValue", "Value": {
        "WFDictionaryFieldValueItems": [{"WFItemType": 0, "WFKey": text(k),
                                         "WFValue": text(v)} for k, v in values.items()]}}

def ask(prompt, kind="Text"):
    params = {"WFAskActionPrompt": prompt, "WFInputType": kind,
              "CustomOutputName": prompt, "WFAskActionAllowsMultiline": False}
    if kind == "Date":
        params["WFAskActionDefaultAnswer"] = variable({"Type": "CurrentDate"})
    return action("ask", **params)

def choose(prompt, items):
    values = action("list", WFItems=items, CustomOutputName=prompt)
    return action("choosefromlist", WFInput=variable(values), WFChooseFromListActionPrompt=prompt,
                  WFChooseFromListActionSelectMultiple=False, CustomOutputName=prompt)

def date_format(value, pattern):
    return action("format.date", WFDate=variable(value), WFInput=variable(value),
                  WFDateFormatStyle="Custom", WFDateFormat="Custom", WFDateFormatString=pattern,
                  WFTimeFormatStyle="None", CustomOutputName="Data formattata")

action("comment", WFCommentActionText="Aggiunge una voce al tuo garage BMW. Il collegamento consente solo nuovi inserimenti. Non condividere questo comando, che contiene la tua chiave personale.")
request_id = date_format({"Type": "CurrentDate"}, "yyyy-MM-dd'T'HH:mm:ss.SSSXXXXX")
group = str(uuid.uuid4()).upper()
menu = ["Rifornimento", "Manutenzione", "Telepass", "Altra spesa"]
action("choosefrommenu", WFControlFlowMode=0, GroupingIdentifier=group,
       WFMenuPrompt="Cosa vuoi aggiungere al garage?", WFMenuItems=menu)
for title, kind in zip(menu, ["refuel", "maintenance", "telepass", "expense"]):
    action("choosefrommenu", WFControlFlowMode=1, GroupingIdentifier=group, WFMenuItemTitle=title)
    date = date_format(ask("Data della spesa", "Date"), "yyyy-MM-dd")
    amount = ask("Importo speso in euro", "Number")
    body = {"type": kind, "request_id": request_id, "date": date, "amount": amount}
    if kind == "refuel":
        body["liters"] = ask("Litri di benzina", "Number")
        body["station"] = ask("Distributore (es. Q8)")
        body["km"] = ask("Chilometri del contachilometri", "Number")
        body["full_tank"] = choose("Hai fatto il pieno completo?", ["No", "Sì"])
    elif kind == "maintenance":
        body["description"] = ask("Descrizione della manutenzione")
        body["workshop"] = ask("Officina")
        body["km"] = ask("Chilometri del contachilometri", "Number")
    elif kind == "expense":
        body["description"] = ask("Descrizione della spesa")
    if kind != "telepass":
        body["payment"] = choose("Come hai pagato?", ["Carta comune", "Revolut", "Contanti", "Mamma", "Papà", "Non specificato"])
    response = action("downloadurl", WFURL=endpoint, WFHTTPMethod="POST", WFHTTPBodyType="JSON",
                      WFHTTPHeaders=dictionary({"X-Garage-Key": token, "Content-Type": "application/json"}),
                      WFJSONValues=dictionary(body), CustomOutputName="Risposta del garage")
    message = action("getvalueforkey", WFInput=variable(response), WFDictionaryKey="message",
                     WFGetDictionaryValueType="Value", CustomOutputName="Esito salvataggio")
    action("showresult", Text=text(message))
action("choosefrommenu", WFControlFlowMode=2, GroupingIdentifier=group)
workflow = {"WFWorkflowName": "Aggiungi spesa BMW", "WFWorkflowActions": actions,
            "WFWorkflowClientRelease": "3.0", "WFWorkflowClientVersion": "2605.0.5",
            "WFWorkflowMinimumClientVersion": 900, "WFWorkflowMinimumClientVersionString": "900",
            "WFWorkflowIcon": {"WFWorkflowIconStartColor": 4282601983, "WFWorkflowIconGlyphNumber": 61440},
            "WFWorkflowTypes": ["NCWidget"], "WFWorkflowInputContentItemClasses": [],
            "WFWorkflowImportQuestions": [], "WFQuickActionSurfaces": []}
unsigned = OUT / "Aggiungi spesa BMW.unsigned.shortcut"
unsigned.write_bytes(plistlib.dumps(workflow, fmt=plistlib.FMT_XML, sort_keys=False))
os.chmod(unsigned, 0o600)
print(json.dumps({"file": str(unsigned), "actions": len(actions),
                  "token_hash": hashlib.sha256(token.encode()).hexdigest()}))
