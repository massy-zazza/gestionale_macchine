# Comando rapido BMW

Il comando personale `Aggiungi spesa BMW` invia rifornimenti, manutenzioni,
Telepass e altre spese alla funzione Supabase `garage-shortcut`.
Il prezzo al litro viene calcolato dal server usando importo e litri.
Telepass richiede soltanto data e importo.

## File personali

`build_shortcut.py` genera il plist del comando e una chiave casuale in
`output/shortcuts/`, esclusa da Git. Il file firmato contiene questa chiave:
non condividerlo. Non contiene la chiave amministrativa Supabase.
Aprire il file `.shortcut` firmato e confermare l'aggiunta in Comandi Rapidi.
La disponibilita su iPhone richiede la sincronizzazione iCloud dei comandi.

## Autenticazione

La funzione `index.ts` usa `verify_jwt=false` e autentica tutte le richieste
tramite `X-Garage-Key`. Solo l'hash SHA-256 della chiave e registrato in
`public.garage_shortcut_keys`, insieme al veicolo autorizzato.
La tabella ha RLS attiva e nessun accesso per anon/authenticated.
La chiave permette esclusivamente verifica del collegamento e inserimento:
non permette di leggere, modificare o cancellare le spese.
Per revocarla impostare `enabled=false` sulla relativa riga della tabella.

## Verifica

`node integrations/shortcut/verify.mjs` crea quattro vere registrazioni di
prova e controlla che un retry non le duplichi. Eseguirlo solo intenzionalmente:
gli ID da eliminare dopo la prova sono salvati in
`output/shortcuts/qa-records.json`. Non cancellare altre registrazioni.

Verificati il 18 settembre 2026: autenticazione, rifiuto importi negativi,
inserimento dei quattro tipi e retry senza duplicati. Dati di prova rimossi.
Il test interattivo del comando richiede che l'utente completi l'importazione.
