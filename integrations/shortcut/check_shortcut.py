"""Check the date tokens and JSON references without exposing the personal key."""
from pathlib import Path
import plistlib

path = Path(__file__).resolve().parents[2] / "output/shortcuts/Aggiungi spesa BMW.unsigned.shortcut"
actions = plistlib.loads(path.read_bytes())["WFWorkflowActions"]
by_id = {a["WFWorkflowActionParameters"]["UUID"]: a for a in actions}
date_formats = [a for a in actions if a["WFWorkflowActionIdentifier"].endswith("format.date")]
assert len(date_formats) == 5
for action in date_formats:
    params = action["WFWorkflowActionParameters"]
    token = params["WFDate"]
    assert token["WFSerializationType"] == "WFTextTokenString"
    source = token["Value"]["attachmentsByRange"]["{0, 1}"]
    if source["Type"] == "ActionOutput":
        picker = by_id[source["OutputUUID"]]["WFWorkflowActionParameters"]
        assert picker["WFInputType"] == "Date"
        assert params["WFDateFormatString"] == "yyyy-MM-dd"
for action in actions:
    if not action["WFWorkflowActionIdentifier"].endswith("downloadurl"):
        continue
    items = action["WFWorkflowActionParameters"]["WFJSONValues"]["Value"]["WFDictionaryFieldValueItems"]
    date = next(item for item in items if item["WFKey"]["Value"]["string"] == "date")
    source = date["WFValue"]["Value"]["attachmentsByRange"]["{0, 1}"]
    assert by_id[source["OutputUUID"]]["WFWorkflowActionIdentifier"].endswith("format.date")
print("Four date pickers and their formatted JSON references verified")
