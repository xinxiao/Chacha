----------------------------------------------------------------------
-- Chacha - Construct objects in database
-- Security level: Classfied
--
-- Author: Xiao Xin
-- Date: Apr. 5th, 2016
----------------------------------------------------------------------


/*********************************************************************
	Tables
*********************************************************************/

-- Security Question
CREATE TABLE SECURITY_QUESTION(
	ID		SERIAL		PRIMARY KEY,
	Question	TEXT		NOT NULL
);

-- Initialize value in security question
INSERT INTO SECURITY_QUESTION (Question)
VALUES
('What is your mother''s maiden name?'),
('Which model is your first car?'),
('Where did you go for college?');

--- Account
CREATE TABLE ACCOUNT(
	Email		VARCHAR(50)	PRIMARY KEY,
	Name		VARCHAR(50)	NOT NULL,
	Password	TEXT		NOT NULL,
	Developer	BOOLEAN		NOT NULL,
	Security	INTEGER,
	Answer		TEXT		NOT NULL,
	FOREIGN KEY (Security) REFERENCES SECURITY_QUESTION(ID)
	ON DELETE CASCADE ON UPDATE CASCADE
);

-- Relation
CREATE TABLE RELATION(
	ID		SERIAL		PRIMARY KEY,
	Name		TEXT		NOT NULL
);

-- In Relation
CREATE TABLE IN_RELATION(
	Account		VARCHAR(50)	REFERENCES ACCOUNT(Email)
					ON DELETE CASCADE ON UPDATE CASCADE,
	Relation	INTEGER		REFERENCES RELATION(ID)
					ON DELETE CASCADE ON UPDATE CASCADE,
	PRIMARY KEY(Account, Relation)
);

-- Contact
CREATE TABLE CONTACT(
	ID		INTEGER		REFERENCES RELATION(ID)
					ON DELETE CASCADE ON UPDATE CASCADE,
	Invitor		VARCHAR(50)	REFERENCES ACCOUNT(Email)
					ON DELETE CASCADE ON UPDATE CASCADE,
	Confirmed	BOOLEAN		NOT NULL DEFAULT FALSE 
);

-- Message
CREATE TABLE MESSAGE(
	ID		SERIAL		PRIMARY KEY,
	Sender		VARCHAR(50)	REFERENCES ACCOUNT(Email)
					ON DELETE CASCADE ON UPDATE CASCADE,
	Receiver	INTEGER		REFERENCES RELATION(ID)
					ON DELETE CASCADE ON UPDATE CASCADE,
	Sent_Time	TIMESTAMP	NOT NULL,
	Content		TEXT		NOT NULL
);

-- Task
CREATE TABLE TASK(
	ID		SERIAL		PRIMARY KEY,
	Date		DATE		NOT NULL,
	Start_Time	TIME		NOT NULL,
	Content		TEXT		NOT NULL
);

-- Has Task
CREATE TABLE HAS_TASK(
	Account		VARCHAR(50)	REFERENCES ACCOUNT(Email)
					ON DELETE CASCADE ON UPDATE CASCADE,
	Task		INTEGER		REFERENCES TASK(ID)
					ON DELETE CASCADE ON UPDATE CASCADE,
	PRIMARY KEY(Account, Task)
);



/**********************************************************************
	View
**********************************************************************/

CREATE VIEW CONTACT_DETAIL AS
  SELECT CONTACT.ID, CONTACT.Invitor, A1.Name AS Invitor_Name,
	 IN_RELATION.Account AS Acceptor, A2.Name AS Acceptor_Name, 
	 Contact.Confirmed
    FROM CONTACT, IN_RELATION, ACCOUNT AS A1, ACCOUNT AS A2
    WHERE CONTACT.ID = IN_RELATION.Relation AND
	  IN_RELATION.Account <> CONTACT.Invitor AND
	  CONTACT.Invitor = A1.Email AND
	  IN_RELATION.Account = A2.Email
    ORDER BY ID;

CREATE VIEW GROUP_DETAIL AS
  SELECT RELATION.ID, RELATION.Name, COUNT(I.Account) AS Member
    FROM RELATION, IN_RELATION AS I, 
	 (SELECT ID FROM RELATION 
	  EXCEPT 
	  (SELECT ID FROM CONTACT)) AS G
    WHERE RELATION.ID=G.ID AND
	  I.Relation = RELATION.ID
    GROUP BY I.Relation, RELATION.ID, RELATION.Name;

CREATE VIEW TASK_DETAIL AS
  SELECT T.ID, T.Date, T.Start_Time, 
	 T.Content, COUNT(H.Account) AS Member
    FROM TASK AS T, HAS_TASK AS H
    WHERE T.ID = H.Task
    GROUP BY T.id, T.Date, T.Start_Time, T.Content;


/**********************************************************************
	Index
**********************************************************************/

-- Account
CREATE INDEX account_security
  ON ACCOUNT(Security);

-- In Relation
CREATE INDEX in_relation_account
  ON IN_RELATION(Account);

CREATE INDEX in_relation_relation
  ON IN_RELATION(Relation);

-- Contact
CREATE INDEX contact_root
  ON CONTACT(ID);

CREATE INDEX contact_invitor
  ON CONTACT(Invitor);

CREATE INDEX contact_status
  ON CONTACT(Confirmed);

-- Task
CREATE INDEX task_date
  ON TASK(Date);

-- Has Task
CREATE INDEX has_task_account
  ON HAS_TASK(Account);

CREATE INDEX has_task_task
  ON HAS_TASK(Task);



/**********************************************************************
	Trigger
**********************************************************************/

-- Account
CREATE FUNCTION clean_security_question()
  RETURNS TRIGGER AS
  $$
  BEGIN
	IF OLD.Security > 3
	THEN
		DELETE
		  FROM SECURITY_QUESTION
		  WHERE ID=OLD.Security;
	END IF;
	RETURN OLD;
  END
  $$
  LANGUAGE plpgsql;

CREATE TRIGGER clean_security_question
  AFTER DELETE 
  ON ACCOUNT
  FOR EACH ROW 
  EXECUTE PROCEDURE clean_security_question();

-- In relation
CREATE FUNCTION clean_relation()
  RETURNS TRIGGER AS
  $$
  BEGIN
	IF count_relation_participant(OLD.Relation) = 0 OR
	   is_contact(OLD.Relation)
	THEN
		DELETE FROM RELATION 
		  WHERE ID=OLD.Relation;
	END IF;	
	RETURN OLD;
  END
  $$
  LANGUAGE plpgsql;

CREATE TRIGGER clean_relation
  AFTER DELETE
  ON IN_RELATION
  FOR EACH ROW
  EXECUTE PROCEDURE clean_relation();

-- Contact
CREATE FUNCTION clean_contact()
  RETURNS TRIGGER AS
  $$
  BEGIN
	DELETE 
	  FROM RELATION
	  WHERE ID=OLD.ID;
	RETURN OLD;
  END
  $$
  LANGUAGE plpgsql;
 
CREATE TRIGGER clean_contact
  AFTER DELETE
  ON CONTACT
  FOR EACH ROW
  EXECUTE PROCEDURE clean_contact();

-- Has Task
CREATE FUNCTION clean_task()
  RETURNS TRIGGER AS
  $$
  BEGIN
	IF count_task_participant(OLD.Task) = 0 THEN
          DELETE FROM TASK
	    WHERE ID=OLD.Task;
	END IF;
	RETURN OLD;
  END
  $$
  LANGUAGE plpgsql;

CREATE TRIGGER clean_task
  AFTER DELETE
  ON HAS_TASK
  FOR EACH ROW
  EXECUTE PROCEDURE clean_task();



/**********************************************************************
	Function
**********************************************************************/

CREATE FUNCTION add_security_question(q TEXT)
  RETURNS INTEGER AS
  $$
	INSERT INTO
   	  SECURITY_QUESTION(Question)
	  VALUES
	  (q)
	  RETURNING ID;
  $$
  LANGUAGE SQL;	

CREATE FUNCTION add_account
  (VARCHAR, VARCHAR, TEXT, BOOLEAN, INTEGER, TEXT)
  RETURNS VOID AS
  $$
	INSERT INTO
	ACCOUNT
	VALUES
	($1, $2, $3, $4, $5, $6);
  $$
  LANGUAGE SQL SECURITY DEFINER;

CREATE FUNCTION add_account_with_security_question
  (VARCHAR, VARCHAR, TEXT, BOOLEAN, TEXT, TEXT)
  RETURNS VOID AS
  $$
	SELECT add_account
        ($1, $2,
	 $3, $4,
	 (SELECT add_security_question($5)), $6);
  $$
  LANGUAGE SQL SECURITY DEFINER;

CREATE FUNCTION select_info(e VARCHAR, p TEXT)
  RETURNS TABLE(Name			TEXT,
		Security_Question	TEXT)
  AS
  $$
	SELECT A.Name, S.Question
	  FROM ACCOUNT AS A, SECURITY_QUESTION AS S
	  WHERE A.Email = e AND
		A.Password = p AND
		A.Security = S.ID;
  $$
  LANGUAGE SQL SECURITY DEFINER;

CREATE FUNCTION remove_account(e VARCHAR, p TEXT)
  RETURNS VOID AS
  $$
	DELETE FROM ACCOUNT
	  WHERE Email = e AND
		Password = p;
  $$
  LANGUAGE SQL SECURITY DEFINER;

CREATE FUNCTION update_password(e VARCHAR, ans TEXT, new_p TEXT)
  RETURNS BOOLEAN AS
  $$
  BEGIN
	IF EXISTS(SELECT Email 
		    FROM ACCOUNT 
		    WHERE Email=e AND Answer=ans)
	THEN
		UPDATE ACCOUNT
		  SET Password = new_p
		  WHERE Email = e;
		RETURN TRUE;
	ELSE
		RETURN FALSE;
	END IF;
  END
  $$
  LANGUAGE plpgsql SECURITY DEFINER;

CREATE FUNCTION validate_account(e VARCHAR, pass TEXT) 
  RETURNS BOOLEAN AS
  $$
	SELECT (Password=pass)
	  FROM ACCOUNT
	  WHERE Email=e;
  $$
  LANGUAGE SQL SECURITY DEFINER;

CREATE FUNCTION validate_developer(e VARCHAR, pass TEXT)
  RETURNS BOOLEAN AS
  $$
	SELECT (Password=pass)
	  FROM ACCOUNT
	  WHERE Developer AND
		Email=e;
  $$
  LANGUAGE SQL SECURITY DEFINER;

CREATE FUNCTION count_relation_participant(rid INTEGER)
  RETURNS BIGINT AS
  $$
	SELECT COUNT(Account)
	  FROM IN_RELATION
	  WHERE Relation=rid;
  $$
  LANGUAGE SQL;

CREATE FUNCTION is_in_relation(email VARCHAR, rid INTEGER)
  RETURNS BOOLEAN AS
  $$
	SELECT EXISTS(
	  SELECT Account
	    FROM IN_RELATION
	    WHERE Relation=rid AND
		  Account=email);
  $$
  LANGUAGE SQL;

CREATE FUNCTION is_contact(rid INTEGER)
  RETURNS BOOLEAN AS
  $$
	SELECT EXISTS(
           SELECT ID FROM CONTACT WHERE ID=rid);
  $$
  LANGUAGE SQL;

CREATE FUNCTION add_relation(relation_name TEXT)
  RETURNS INTEGER AS
  $$
	INSERT INTO 
	  RELATION(Name)
	  VALUES (relation_name)
	  RETURNING ID;
  $$
  LANGUAGE SQL SECURITY DEFINER;

CREATE FUNCTION exist_relation(gid INTEGER)
  RETURNS BOOLEAN AS
  $$
	SELECT EXISTS(SELECT ID FROM Relation WHERE ID=gid);
  $$
  LANGUAGE SQL;

CREATE FUNCTION exist_contact(VARCHAR, VARCHAR)
  RETURNS BOOLEAN AS
  $$
	SELECT EXISTS(
		SELECT ID 
		  FROM CONTACT_DETAIL 
		  WHERE (Invitor=$1 AND Acceptor=$2)
			OR
			(Invitor=$2 AND Acceptor=$1)
	);
  $$
  LANGUAGE SQL;

CREATE FUNCTION get_contact_id(VARCHAR, VARCHAR)
  RETURNS INTEGER AS
  $$
	SELECT ID
	  FROM CONTACT_DETAIL 
	  WHERE (Invitor=$1 AND Acceptor=$2)
		OR
		(Invitor=$2 AND Acceptor=$1);
  $$
  LANGUAGE SQL;

CREATE FUNCTION add_contact_h(gid INTEGER, invite VARCHAR, receive VARCHAR)
  RETURNS VOID AS
  $$
	INSERT INTO
	  IN_RELATION
	  VALUES
	  (invite, gid),
	  (receive, gid);
	INSERT INTO
	  CONTACT(ID, Invitor)
	  VALUES
	  (gid, invite);
  $$
  LANGUAGE SQL SECURITY DEFINER;

CREATE FUNCTION add_contact(invite VARCHAR, receive VARCHAR)
  RETURNS BOOLEAN AS
  $$
  BEGIN
	IF exist_contact(invite, receive) THEN
		RETURN FALSE;
	END IF;

	PERFORM add_contact_h((SELECT add_relation('Contact')),
	  	   	      invite,
	     		      receive);
	RETURN TRUE;
  END
  $$
  LANGUAGE plpgsql SECURITY DEFINER;

CREATE FUNCTION select_contact(e VARCHAR, p text)
  RETURNS TABLE(ID		INTEGER,
		Email		VARCHAR,
		Name		TEXT)
  AS
  $$
	SELECT ID, Acceptor AS Email, 
	       Acceptor_Name AS Name
	  FROM CONTACT_DETAIL, ACCOUNT
	  WHERE ACCOUNT.Email=e AND
		ACCOUNT.Password=p AND
		Confirmed AND
		CONTACT_DETAIL.Invitor=e
	UNION
	SELECT ID, Invitor AS Email,
	       Invitor_Name AS Name
	  FROM CONTACT_DETAIL, ACCOUNT
	  WHERE ACCOUNT.Email=e AND
		ACCOUNT.Password=p AND
		Confirmed AND
	        CONTACT_DETAIL.Acceptor=e;
  $$
  LANGUAGE SQL SECURITY DEFINER;

CREATE FUNCTION select_group(e VARCHAR, p TEXT)
  RETURNS TABLE(ID		INTEGER,
		Name		VARCHAR,
		Member		BIGINT)
  AS
  $$
	SELECT GROUP_DETAIL.ID, GROUP_DETAIL.Name, GROUP_DETAIL.Member
	  FROM GROUP_DETAIL, IN_RELATION, ACCOUNT
	  WHERE ACCOUNT.Email = e AND
		ACCOUNT.Password = p AND
		GROUP_DETAIL.ID = IN_RELATION.Relation AND
		IN_RELATION.Account=e;
  $$
  LANGUAGE SQL SECURITY DEFINER;

CREATE FUNCTION select_invitation(e VARCHAR, p TEXT)
  RETURNS TABLE(ID		INTEGER,
		Email		VARCHAR,
		Name		TEXT)
  AS
  $$
	SELECT ID, Invitor AS Email, Invitor_Name
	  FROM CONTACT_DETAIL, ACCOUNT
	  WHERE ACCOUNT.Email = e AND
		ACCOUNT.Password = p AND
		NOT Confirmed AND
		Acceptor = e;
  $$
  LANGUAGE SQL SECURITY DEFINER;

CREATE FUNCTION accept_invitation(VARCHAR, VARCHAR, TEXT)
  RETURNS BOOLEAN AS
  $$
  BEGIN
	IF  $1 IN (SELECT Email FROM select_invitation($2, $3)) THEN
  		UPDATE CONTACT
		  SET Confirmed=TRUE
		  WHERE ID = get_contact_id($1, $2);
		RETURN TRUE;
	ELSE
		RETURN FALSE;
	END IF;
  END
  $$
  LANGUAGE plpgsql SECURITY DEFINER;

CREATE FUNCTION reject_invitation(VARCHAR, VARCHAR, TEXT)
  RETURNS BOOLEAN AS
  $$
  BEGIN
	IF $1 IN (SELECT Email FROM select_invitation($2, $3))  THEN
		DELETE
		  FROM CONTACT
		  WHERE ID=get_contact_id($1, $2);
		RETURN TRUE;
	ELSE
		RETURN FALSE;
	END IF;
  END
  $$
  LANGUAGE plpgsql SECURITY DEFINER;

CREATE FUNCTION join_group(email VARCHAR, gid INTEGER)
  RETURNS VOID AS
  $$
	INSERT
	  INTO IN_RELATION(Account, Relation)
	  VALUES
	  (email, gid);
  $$
  LANGUAGE SQL SECURITY DEFINER;

CREATE FUNCTION leave_relation(email VARCHAR, gid INTEGER)
  RETURNS VOID AS
  $$
	DELETE 
	  FROM IN_RELATION
	  WHERE Account=email AND
		Relation=gid;
  $$
  LANGUAGE SQL SECURITY DEFINER;

CREATE FUNCTION store_message
  (VARCHAR, INTEGER, TEXT)
  RETURNS VOID AS
  $$
	INSERT
	  INTO MESSAGE(Sender, Receiver, 
		       Sent_Time, Content)
	  VALUES
	  ($1, $2, current_timestamp, $3);
  $$
  LANGUAGE SQL SECURITY DEFINER;

CREATE FUNCTION get_message_history(rid INTEGER)
  RETURNS TABLE(Sent_Time 	TIMESTAMP,
		Sender		VARCHAR,
		Sender_Name	VARCHAR,
		Content		TEXT) AS
  $$
	SELECT Sent_Time, Sender, Name AS Sender_Name, Content
	  FROM MESSAGE, ACCOUNT
	  WHERE Receiver = rid AND
		MESSAGE.Sender = ACCOUNT.Email
	  ORDER BY Sent_Time ASC;
  $$
  LANGUAGE SQL SECURITY DEFINER;

CREATE FUNCTION add_task(DATE, TIME, TEXT)
  RETURNS INTEGER AS
  $$
	INSERT INTO 
	  TASK(Date, Start_Time, Content)
	  VALUES
	  ($1, $2, $3)
	  RETURNING ID;
  $$
  LANGUAGE SQL SECURITY DEFINER;

CREATE FUNCTION count_task_participant(tid INTEGER)
  RETURNS BIGINT AS
  $$
	SELECT COUNT(Account)
	  FROM HAS_TASK
	  WHERE TASK=tid;
  $$
  LANGUAGE SQL;

CREATE FUNCTION select_task(e VARCHAR, p TEXT)
  RETURNS TABLE(ID		INTEGER,
		Date		DATE,
		Start_Time	TIME,
	        Content		TEXT)
  AS
  $$
	SELECT T.ID, T.Date, T.Start_Time, T.Content
	  FROM TASK_DETAIL AS T, HAS_TASK AS H, 
	       ACCOUNT AS A
	  WHERE A.Email = e AND
		A.Password = p AND
		H.TASK = T.ID AND
		T.Date >= current_date AND
		H.Account = e
  $$
  LANGUAGE SQL SECURITY DEFINER;

CREATE FUNCTION share_task(email VARCHAR, tid INTEGER)
  RETURNS VOID AS
  $$
	INSERT INTO
	  HAS_TASK(Account, Task)
	  VALUES
	  (email, tid);
  $$
  LANGUAGE SQL SECURITY DEFINER;

CREATE FUNCTION leave_task(email VARCHAR, tid INTEGER)
  RETURNS VOID AS
  $$
	DELETE 
	  FROM HAS_TASK
	  WHERE Account=email AND
		Task=tid;
  $$
  LANGUAGE SQL SECURITY DEFINER;

CREATE FUNCTION select_group_candidate(r INTEGER, e VARCHAR, p TEXT)
  RETURNS TABLE(ID	INTEGER,
		Email	VARCHAR,
		Name	TEXT)
  AS
  $$
	SELECT *
	  FROM select_contact(e, p)
	  WHERE Email NOT IN
		(SELECT Account
		   FROM IN_RELATION
		   WHERE Relation = r);
  $$
  LANGUAGE SQL SECURITY DEFINER;

CREATE FUNCTION select_task_candidate(t INTEGER, e VARCHAR, p TEXT)
  RETURNS TABLE(ID	INTEGER,
		Email	VARCHAR,
		Name	TEXT)
  AS
  $$
	SELECT *
	  FROM select_contact(e, p)
	  WHERE Email NOT IN
		(SELECT Account
		   FROM HAS_TASK
		   WHERE Task = t);
  $$
  LANGUAGE SQL SECURITY DEFINER;

/**********************************************************************
	Constraint
**********************************************************************/

-- Contact
ALTER TABLE CONTACT
  ADD CONSTRAINT contact_restrictor
  CHECK (is_in_relation(Invitor, ID) AND
         count_relation_participant(ID) = 2);

-- In Relation
ALTER TABLE IN_RELATION
  ADD CONSTRAINT contact_insulator
  CHECK (NOT is_contact(Relation));

ALTER TABLE MESSAGE
  ADD CONSTRAINT valid_sender
  CHECK (is_in_relation(sender, receiver));
