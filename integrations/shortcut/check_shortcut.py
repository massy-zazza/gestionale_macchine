"""Check the date tokens and JSON references without exposing the personal key."""
from pathlib import Path
import plistlib

path = Path(__file__).resolve().parents[2] / "output/shortcuts/Aggiungi spesa BMW.unsigned.shortcut"
actions = plistlib.loads(path.read_bytes())["WFWorkflowActions"]
by_id = {a["WFWorkflowActionParameters"]["UUID"]: a for a in actions}
assert not any(a["WFWorkflowActionIdentifier"].endswith("format.date") for a in actions)
pickers = [a for a in actions if a["WFWorkflowActionIdentifier"].endswith("ask")
           and a["WFWorkflowActionParameters"]["WFInputType"] == "Date"]
assert len(pickers) == 4
for action in actions:
    if not action["WFWorkflowActionIdentifier"].endswith("downloadurl"):
        continue
    items = action["WFWorkflowActionParameters"]["WFJSONValues"]["Value"]["WFDictionaryFieldValueItems"]
    date = next(item for item in items if item["WFKey"]["Value"]["string"] == "date")
    source = date["WFValue"]["Value"]["attachmentsByRange"]["{0, 1}"]
    picker = by_id[source["OutputUUID"]]
    assert picker["WFWorkflowActionIdentifier"].endswith("ask")
    assert picker["WFWorkflowActionParameters"]["WFInputType"] == "Date"
    formats = [a for a in source["Aggrandizements"] if a["Type"] == "WFDateFormatVariableAggrandizement"]
    assert len(formats) == 1 and formats[0]["WFDateFormat"] == "yyyy-MM-dd"
print("Four date pickers and their formatted JSON references verified")
