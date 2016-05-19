# Chacha

### Introduction
Chacha is a light-weight chatting and task-sharing service. Here are the scripts used to conduct the database construction and API service.

### Table of contents
1. [Documentation](#documentation)
2. [Design](#design)
3. [Installation](#installation)

### Documentation
The call and feedback of this API system is conducted through HTTP requests and responses, and all feedbacks are packaged in JSON format. Please encure the connectivity of internet when you incorporate this service. To use this service in higher-level language such as `Javascript` or `Python`, please import and use packages that can handle HTTP reuqests and responses. 

All requests to the API server should be in the format as
```url
http://hostname:port/route?paramater1=value1&paramater2=value2...
```

The functionality of this service and be divided into 4 sub-modules. They can be differed by the first part of its route to service. The 4 parts are: 

1. [Account](#account)
2. [Group](#group)
3. [Message](#message)
4. [Task](#task)

#### Account

+ Parameters

	|Name		|Description									     |
	|---------------|------------------------------------------------------------------------------------|
	|Email		|Email address that a user uses to register. Primary identifier of a user	     |
	|Password	|Password system uses for user authentication.					     |
	|Name		|Name users can use as aliases							     |
	|Developer	|If a user is developer								     |
	|Security	|ID number of a security question that has been stored in the database		     |
	|Question	|The content of security question if a user want to use customized security question |
	|Answer		|Answer to user's security question					             |
	|Invitor	|Invitor of a two-people contact relationship					     |
	|Acceptor	|Acceptor of a two-people contact relationship					     |

+ Methods

	|Method |Route     	      |Parameter						   |Description	     		         		|
	|-------|---------------------|------------------------------------------------------------|----------------------------------------------------|
	|PUT    |/account  	      |email, password, name, developer, security, question, answer|Make a new account     	         		|
	|DELETE	|/account  	      |email, password						   |Delete an existing account	         		|
	|POST	|/account/validate    |email, password						   |User validation using password       		|
	|POST   |/account/developer   |email, password						   |Developer validation using password 		|
	|POST	|/account/group	      |email							   |Select the group that the user is in 		|  
	|POST	|/account/contact     |email							   |Select all the contact the user has  		|
	|POST	|/account/invitation  |email							   |Select all the invitations the user has received    |
	|POST   |/account/invite      |invitor, acceptor					   |Invite another user to be contact			|
	|POST	|/account/accept      |invitor, acceptor					   |Accept the invitation from another user		|
	|POST   |/account/reject      |invitor, acceptor					   |Reject the invitation from another user		|

#### Group

+ Parameters

	|Name		|Description									     |
	|---------------|------------------------------------------------------------------------------------|

+ Methods

	|Method |Route     	      |Parameter						   |Description	     		         		|
	|-------|---------------------|------------------------------------------------------------|----------------------------------------------------|

#### Message

+ Parameters

	|Name		|Description									     |
	|---------------|------------------------------------------------------------------------------------|

+ Methods

	|Method |Route     	      |Parameter						   |Description	     		         		|
	|-------|---------------------|------------------------------------------------------------|----------------------------------------------------|


#### Task

+ Parameters

	|Name		|Description									     |
	|---------------|------------------------------------------------------------------------------------|

+ Methods

	|Method |Route     	      |Parameter						   |Description	     		         		|
	|-------|---------------------|------------------------------------------------------------|----------------------------------------------------|



### Design
![ER Diagram](/img/er.png "ER Diagram")
![Schema Chart](/img/schema.png "Schema Chart")



### Installation
Several programs have to be set up first in order to host this API service. 

1. [PostgreSQL](http://www.postgresql.org/)
2. [NodeJS](https://nodejs.org/en/)

The operating system is recommended to be Linux or OS X. You can find free distribution of Linux suchas [Ubuntu](http://www.ubuntu.com/) or [CentOS](https://www.centos.org/). If you want to host Chacha through a cloud service, good options are [Amazon AWS](https://aws.amazon.com) and [DigitalOcean](https://www.digitalocean.com/);

If you are using Ubuntu as primary operating system, you can follow this [tutorial for PostgreSQL server](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-postgresql-on-ubuntu-14-04) and this [tutorial for setting up NodeJS runtime environment](https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-an-ubuntu-14-04-server). Both of this two tutorials are generously offered by [DigitalOcean Community Tutorials](https://www.digitalocean.com/community/tutorials)

The NPM dependies of this project includes

1. [express](https://www.npmjs.com/package/express)
2. [pg](https://www.npmjs.com/package/pg)
3. [encrypton](https://www.npmjs.com/package/encrypton)

You can better understand the working mechanism of Chacha API service by refering to the documentation of these packages.

The source code of this service can be acquire from [Github](https://github.com/xinxiao/Chacha-Database). To download the source, please follow the following this procedure in a bash terminal
```bash
git clone https://github.com/xinxiao/Chacha-Database.git
```

Once you have downloaded the source code, please route to the `database` folder and set up the database entities by tunning
```bash
psql -f build.sql
```

This will construct all the required entities in the database system for the API service. Once you have finished the construction, for security purposes, please open the processor file to set up a low-accessibility processor account for your API service. Please replace the unfilled information in the file as instructed below. 

```sql
CREATE USER --[Name of the processor account];
  WITH ENCRYPTED PASSWORD --'[Password for the processor account]';

GRANT EXECUTE ON FUNCTION
    -- The granted procedures
  TO --[Name of the processor account];
```

After these procedures, the database environment for Chacha should be fully constructed. There is also a clean up file provided for Chacha. You can remove all the entities construted for Chacha by running
```bash
psql -f clean.sql
```
However, before running this file please remeber to replace the last line of the 'clean.sql' file with the name of the processor you constructed. The query should be in this format,
```sql
DROP USER --[Name of the processor account];
```

After database constrution, please write a file named `config.json` in the root file of the service. This file would store some of the basic parameter for the API configuration. The file should be in this format:
```json
{
	"port": "The port which you want the service to listen on",
	"db-token": "The key used for the encryption of data within databse",
	"handler": "Name of the database processor account which you constructed",
	"password": "Password of the database processor. Should have been encrypted using Encrypton"
}
```

After these basic configurations, the API service should be ready to run. 

You can temporarily run the API service by running this command in the root folder. 
```bash
node server.js
```
If you want to keep developing Chacha, I personally recommand `nodemon` during the process of development. `nodemon` can let you host and modify the service scripts at the same time. 
You can install `noodemon` by
```bash
sudo npm install -g nodemon
```
and use `nodemon` to host the service by
```bash
nodemon server.js
```
Otherwise, you can continuously host the service using `forever` package from npm.
You can install `forever` through
```bash
sudo npm install -g forever
```
Then host the service by
```bash
forever start server.js
```
If you want to stop the service while using `forever`, you can terminate by
```bash
forever stop server.js
```
