# Govway Apicat Web

Progetto per la creazione del war che include la console Angular e il reverse-proxy verso le API-Catalogo.

## Riportare Codice Catalogo

Per integrare il codice angular del catalogo e' necessario eseguire la compilazione del progetto Angular e copiare il contenuto della directory `dist` all'interno della directort `src/main/angular/catalogo`.
Eventuali file di configurazione da inserire nella directory `assets` che richiedono dei parametri da valorizzare in fase di compilazione devono essere posizionati nella directory 'src/main/webapp/assets' avendo cura di inserire il placeholder nel punto desiderato del file e riportando lo stesso placeholder all'interno dei file di filtro presenti in `src/main/resources/filters`.
Eseguire infine il merge tra il file 'src/main/angular/catalogo/index.html' e `src/main/webapp/index.jsp`.

## Compilazione
Per la compilazione utilizzare il comando

``` cmd
mvn clean install -Denv=AMBIENTE
```
