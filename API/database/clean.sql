--------------------------------------------
-- Chacha - Remove all objects in database
--
-- Author: Xiao Xin
-- Date: Apr. 5th, 2016
--------------------------------------------

-- Drop trigger and trigger related functions
DROP TRIGGER clean_relation ON IN_RELATION;
DROP TRIGGER clean_security_question ON ACCOUNT;
DROP TRIGGER clean_task ON HAS_TASK;
DROP TRIGGER clean_contact ON CONTACT;

DROP FUNCTION clean_security_question();
DROP FUNCTION clean_relation();
DROP FUNCTION clean_contact();
DROP FUNCTION clean_task();

-- Drop indexes
DROP INDEX account_security;
DROP INDEX in_relation_account;
DROP INDEX in_relation_relation;
DROP INDEX contact_root;
DROP INDEX contact_invitor;
DROP INDEX task_date;
DROP INDEX has_task_account;
DROP INDEX has_task_task;

-- Drop wiew
DROP VIEW CONTACT_DETAIL;
DROP VIEW GROUP_DETAIL;
DROP VIEW TASK_DETAIL;

-- Drop tables
DROP TABLE HAS_TASK;
DROP TABLE MESSAGE;
DROP TABLE IN_RELATION;
DROP TABLE TASK;
DROP TABLE CONTACT;
DROP TABLE RELATION;
DROP TABLE ACCOUNT;
DROP TABLE SECURITY_QUESTION;

-- Drop all functions
DROP FUNCTION add_security_question(TEXT);
DROP FUNCTION add_account(VARCHAR, VARCHAR, TEXT, BOOLEAN, INTEGER, TEXT);
DROP FUNCTION add_account_with_security_question(VARCHAR, VARCHAR, TEXT, BOOLEAN, TEXT, TEXT);
DROP FUNCTION remove_account(VARCHAR, TEXT);
DROP FUNCTION update_password(VARCHAR, TEXT, TEXT);
DROP FUNCTION validate_account(VARCHAR, TEXT);
DROP FUNCTION validate_developer(VARCHAR, TEXT);
DROP FUNCTION count_relation_participant(INTEGER);
DROP FUNCTION is_in_relation(VARCHAR, INTEGER);
DROP FUNCTION is_contact(INTEGER);
DROP FUNCTION exist_relation(INTEGER);
DROP FUNCTION exist_contact(VARCHAR, VARCHAR);
DROP FUNCTION get_contact_id(VARCHAR, VARCHAR);
DROP FUNCTION add_relation(TEXT);
DROP FUNCTION add_contact_h(INTEGER, VARCHAR, VARCHAR);
DROP FUNCTION add_contact(VARCHAR, VARCHAR);

DROP FUNCTION select_info(VARCHAR, TEXT);
DROP FUNCTION select_contact(VARCHAR, TEXT);
DROP FUNCTION select_group(VARCHAR, TEXT);
DROP FUNCTION select_invitation(VARCHAR, TEXT);
DROP FUNCTION select_task(VARCHAR, TEXT);

DROP FUNCTION accept_invitation(VARCHAR, VARCHAR, TEXT);
DROP FUNCTION reject_invitation(VARCHAR, VARCHAR, TEXT);
DROP FUNCTION join_group(VARCHAR, INTEGER);
DROP FUNCTION leave_relation(VARCHAR, INTEGER);
DROP FUNCTION store_message(VARCHAR, INTEGER, TEXT);
DROP FUNCTION get_message_history(INTEGER);
DROP FUNCTION add_task(DATE, TIME, TEXT);
DROP FUNCTION count_task_participant(INTEGER);
DROP FUNCTION share_task(VARCHAR, INTEGER);
DROP FUNCTION leave_task(VARCHAR, INTEGER);

DROP FUNCTION select_group_candidate(INTEGER, VARCHAR, TEXT);
DROP FUNCTION select_task_candidate(INTEGER, VARCHAR, TEXT);

-- Drop processor role
DROP USER --[Name of the processor account];
