-- Align server-side lead validation with the public contact form.
alter table public.leads
  add constraint leads_name_trimmed_check check (name = btrim(name)),
  add constraint leads_email_format_check
    check (
      email = lower(btrim(email))
      and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$'
    ),
  add constraint leads_company_trimmed_check
    check (company is null or (company = btrim(company) and char_length(company) <= 160)),
  add constraint leads_message_trimmed_check check (message = btrim(message)),
  add constraint leads_interest_allowed_check
    check (interest in (
      'Investment',
      'Joint venture or partnership',
      'Offtake or purchasing',
      'Technical or operating services',
      'Other'
    ));
