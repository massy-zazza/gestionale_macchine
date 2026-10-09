"""Build the separate university trip shortcut using native Apple date tokens."""
import build_shortcut as base
import os
import plistlib
import uuid

base.actions.clear()
base.action('comment', WFCommentActionText='Viaggi universitari BMW. Non condividere: contiene una chiave personale di inserimento.')
request_id=base.action('gettext',WFTextActionText=base.text(base.date_format({'Type':'CurrentDate'},"yyyy-MM-dd'T'HH:mm:ss.SSSXXXXX")),CustomOutputName='Identificativo')
group=str(uuid.uuid4()).upper()
base.action('choosefrommenu',WFControlFlowMode=0,GroupingIdentifier=group,WFMenuPrompt='Viaggi universitari',WFMenuItems=['Aggiungi viaggio','Aggiungi rimborso'])
for label,kind in [('Aggiungi viaggio','trip'),('Aggiungi rimborso','reimbursement')]:
    base.action('choosefrommenu',WFControlFlowMode=1,GroupingIdentifier=group,WFMenuItemTitle=label)
    body={'type':kind,'request_id':request_id,'date':base.date_format(base.ask('Data del viaggio','Date'),'yyyy-MM-dd')}
    if kind=='trip':
        body['entry_station']=base.ask('Entrata autostrada (es. Mantova Nord)')
        body['exit_station']=base.ask('Uscita autostrada (es. Padova Ovest)')
        body['distance_km']=base.ask('Chilometri percorsi','Number')
        body['consumption']=base.ask('Consumo medio indicato dalla macchina','Number')
        body['consumption_unit']=base.choose('Unita del consumo',['l/100 km','km/l'])
    else:
        body['amount']=base.ask('Rimborso totale ricevuto in euro','Number')
    response=base.action('downloadurl',WFURL=base.endpoint,WFHTTPMethod='POST',WFHTTPBodyType='JSON',WFHTTPHeaders=base.dictionary({'X-Garage-Key':base.token,'Content-Type':'application/json'}),WFJSONValues=base.dictionary(body),CustomOutputName='Risposta garage')
    message=base.action('getvalueforkey',WFInput=base.variable(response),WFDictionaryKey='message',WFGetDictionaryValueType='Value',CustomOutputName='Esito')
    base.action('showresult',Text=base.text(message))
base.action('choosefrommenu',WFControlFlowMode=2,GroupingIdentifier=group)
workflow={**base.workflow,'WFWorkflowName':'Viaggi universitari BMW','WFWorkflowActions':base.actions}
path=base.OUT/'Viaggi universitari BMW.unsigned.shortcut'
path.write_bytes(plistlib.dumps(workflow,fmt=plistlib.FMT_XML,sort_keys=False))
os.chmod(path,0o600)
print(str(path))
