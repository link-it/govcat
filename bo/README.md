=======
# Installazione

## Requisiti

- WildFly 18
- Java 11
- Postgres 9.3+

## Compilazione

```bash
mvn clean package -P localhost
```

## Setup 

```bash
su postgres
createuser govcat -P 
createdb govcat -O govcat
psql govcat govcat < core/orm/target/database/sql/postgresql/govcat.sql
psql govcat govcat < src/main/resources/database/sql/init.sql

mkdir /var/govcat/log
mkdir /var/govcat/conf

cp src/main/resources/database/datasource/govcat-ds.xml.postgres /opt/wildfly-18.0.1.Final/standalone/deployments/govcat-ds.xml
cp servlets/govway-apicat-api/target/classes/govcat-api-ext.properties /var/govcat/conf/govcat-api.properties
cp ../src/main/resources/plugin/configurazione.json /var/govcat/conf/configurazione.json
```

## Deploy

```bash
cp servlets/govway-apicat-api/target/govcat-api.war /opt/local/Programmi/wildfly-18.0.1.Final/standalone/deployments
```
