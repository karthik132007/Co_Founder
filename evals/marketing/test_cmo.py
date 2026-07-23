import logging

from agents.marketing.cmo import spawn_cmo

logger = logging.getLogger(__name__)

message = "I've noticed sales have been a bit slow lately. Are there any skincare trends people are interested in right now that we should take advantage of?"
logger.info("Testing CMO agent with company_id=1, message='%s'", message[:80])
response = spawn_cmo(company_id=1, message=message)
logger.info("CMO agent response: %s", response)
print(response)