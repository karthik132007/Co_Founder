from agents.marketing.cmo import spawn_cmo
message = "I've noticed sales have been a bit slow lately. Are there any skincare trends people are interested in right now that we should take advantage of?"
response= spawn_cmo(company_id=1, message=message)

print(response)