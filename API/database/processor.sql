/**********************************************************************
	Processor
**********************************************************************/

CREATE USER --[Name of the processor account];
  WITH ENCRYPTED PASSWORD --'[Password for the processor account]';

GRANT EXECUTE ON FUNCTION
    add_account(VARCHAR, VARCHAR, TEXT, BOOLEAN, INTEGER, TEXT),
    add_account_with_security_question(VARCHAR, VARCHAR, TEXT, BOOLEAN, TEXT, TEXT),
    remove_account(VARCHAR, TEXT),
    update_password(VARCHAR, TEXT, TEXT),
    validate_account(VARCHAR, TEXT),
    validate_developer(VARCHAR, TEXT),

    select_info(VARCHAR, TEXT),   
    select_group(VARCHAR, TEXT),
    select_contact(VARCHAR, TEXT),
    select_invitation(VARCHAR, TEXT),
    select_task(VARCHAR, TEXT),

    add_contact(VARCHAR, VARCHAR),
    accept_invitation(VARCHAR, VARCHAR, TEXT),
    reject_invitation(VARCHAR, VARCHAR, TEXT),

    add_relation(TEXT),
    join_group(VARCHAR, INTEGER),
    leave_relation(VARCHAR, INTEGER),

    store_message(VARCHAR, INTEGER, TEXT),
    get_message_history(INTEGER),

    add_task(DATE, TIME, TEXT),
    share_task(VARCHAR, INTEGER),
    leave_task(VARCHAR, INTEGER),

    select_group_candidate(INTEGER, VARCHAR, TEXT),
    select_group_candidate(INTEGER, VARCHAR, TEXT)

  TO --[Name of the processor account];
