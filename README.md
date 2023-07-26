# xiVIEW_container

brings together several projects from Rappsilber Laboratory to provide a search software independent web interface to CLMS data. It uses the git submodule mechanism (except for xiAnnotator at the moment).

# Installation Instructions

## 1. Install Prerequisites

- postgresql - i'm using v13.9 
- python 3.10

## 2. create a postgresql role and database to use

```
sudo su postgres
psql
create database xiview;
create user xiadmin with login password 'your_password_here';
grant all privileges on database xiview to xiadmin;
```

find the hba.conf file in the postgresql installation directory and add a line to allow  the xiadmin role to access the database:
e.g. 
```
sudo nano /etc/postgresql/13/main/pg_hba.conf
```
then add the line:
`local   xiview   xiadmin   md5`

then restart postgresql:
```
sudo service postgresql restart
```

## 3. Checkout out this github project ('pride' branch), initialising submodules
 
```
git clone https://github.com/Rappsilber-Laboratory/xiView_container.git
cd xiView_container
git checkout pride
git submodule update --init --recursive
```


## 4. Configure the python environment for the file parser

edit the file xiSPEC_ms_parser/credentials.py to point to your postgressql database.
e.g. so its content is:
```
hostname = 'localhost'
username = 'xiadmin'
password = 'your_password_here'
database = 'xiview'
port = 5432
```

Set up the python environment:

```
cd xiSPEC_ms_parser
pipenv install --python 3.10
```

run create_db_schema.py to create the database tables:
```
python create_db_schema.py
```

parse a test dataset:
```
python process_dataset.py -p PXD038060
```

hopefully that works... it will fetch files from ftp site and store them in a temp directory, then process them 

## 5. Start the flask server for the web visualisation

edit the file xi2_xiview_loader/database.ini to point to your postgressql database.
e.g. so its content is:
```
[postgresql]
host=localhost	
database=xiview
user=xiadmin
password=your_password_here
port=5432
```

Set up the python environment:
```
cd ../xi2_xiview_loader
pipenv install --python 3.10
```

Start the flask web server:
```
pipenv run python -m flask run
```

Then open a browser and go to http://127.0.0.1:5000, you should be able to navigate to processed datasets and see the results.

