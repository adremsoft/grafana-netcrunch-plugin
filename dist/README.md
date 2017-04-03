# NetCrunch App for Grafana

## NetCrunch App activation
![Image Title](https://raw.githubusercontent.com/adremsoft/grafana-netcrunch-plugin/master/doc/movies/activate-netcrunch-plugin.gif)

## Create NetCrunch datasource
![Image Title](https://raw.githubusercontent.com/adremsoft/grafana-netcrunch-plugin/master/doc/movies/create-datasource.gif)

![Image Title](https://raw.githubusercontent.com/adremsoft/grafana-netcrunch-plugin/master/doc/images/datasource-list.jpg)

## Templates

### Select template
![Image Title](https://raw.githubusercontent.com/adremsoft/grafana-netcrunch-plugin/master/doc/movies/select-template.gif)

### Windows workstation
![Image Title](https://raw.githubusercontent.com/adremsoft/grafana-netcrunch-plugin/master/doc/images/windows-workstation-template.jpg)

### Windows server
![Image Title](https://raw.githubusercontent.com/adremsoft/grafana-netcrunch-plugin/master/doc/images/windows-server-template.jpg)

### Linux
![Image Title](https://raw.githubusercontent.com/adremsoft/grafana-netcrunch-plugin/master/doc/images/linux-template.jpg)

### ESX
![Image Title](https://raw.githubusercontent.com/adremsoft/grafana-netcrunch-plugin/master/doc/images/esx-template.jpg)

## Create dashboard
![Image Title](https://raw.githubusercontent.com/adremsoft/grafana-netcrunch-plugin/master/doc/movies/create-dashboard.gif)

## Create template dashboard

![Image Title](https://raw.githubusercontent.com/adremsoft/grafana-netcrunch-plugin/master/doc/images/create-template-1.png)

### Add datasource variable

![Image Title](https://raw.githubusercontent.com/adremsoft/grafana-netcrunch-plugin/master/doc/images/create-template-2.png)

### Add node variable

![Image Title](https://raw.githubusercontent.com/adremsoft/grafana-netcrunch-plugin/master/doc/images/create-template-3.png)

#### Query

Query is used for filtering nodes available in template and should has following syntax:

`<queryOption> ::= 'nodes'[.<map>][.<nodeType>]`

##### `nodes` 

This part of query is mandatory and it gives all nodes from the network atlas.
The simplest possible query which return all atlas nodes is `nodes`. 

##### `<map>`

This selector allows nodes filter belongs to particular atlas map.
For select a map it's necessary to specify atlas group, folders and
view using following syntax:

`networkAtlas("group name").folder("folder name").view("view name")`

###### Example

To obtain the nodes that belong to the view shown in the image below, enter the following query:

`nodes.networkAtlas("Custom Views").folder("My custom folder").folder("My sub folder").view("My view")`

Characters `(` `)` `"` occurring in names must be quoted by `\`. To get nodes from view `My view (old)`
query should be:

`nodes.networkAtlas("Custom Views").folder("My custom folder").folder("My sub folder").view("My view \(old\)")`

![Image Title](https://raw.githubusercontent.com/adremsoft/grafana-netcrunch-plugin/development/doc/images/template-query-view.jpg)

##### `<nodeType>`

This selector is used to filter nodes by type and may be combined with other selectors. 
The types of nodes that can be filter are as follows:

* windows
* windows.server
* windows.workstation
* linux
* bsd
* macos
* solaris
* esx
* xenserver
* unix
* novell
* ibm

###### Example

To filter all linux nodes from specific IP network enter follow query:

`nodes.networkAtlas("IP Networks").folder("Local").view("192.168.0.0/22").linux`

### View of variables

![Image Title](https://raw.githubusercontent.com/adremsoft/grafana-netcrunch-plugin/master/doc/images/create-template-4.png)

### Define a metric of template

![Image Title](https://raw.githubusercontent.com/adremsoft/grafana-netcrunch-plugin/master/doc/images/create-template-5.png)

## Changelog

### v1.0.0
- NetCrunch datasource
- Templates: esx, linux, windows-server, windows-workstation

## Development

### Building
```
npm install
```

#### Production
```
grunt build
```

#### Development
```
grunt develop
grunt watch
```
