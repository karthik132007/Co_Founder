from agents.marketing.cmo import talk_to_cmo
message = "I've noticed sales have been a bit slow lately. Are there any skincare trends people are interested in right now that we should take advantage of?"
response= talk_to_cmo(company_id=1, message=message)

print(response)