tabSignal.connect("openapi.factory.host", function(data)
{
    apihost.one.copy = function()
    {
        var def = new $.Deferred();
        var thisObj = this;

        $.when(this.loadItem(this.model.data.id)).done(function()
        {
            var data = thisObj.model.items[this.model.data.id];
            $.when(encryptedCopyModal.replace(data)).done(function(data)
            {
                delete data.id;
                spajs.ajax.Call({
                    url: hostname + "/api/v2/"+thisObj.model.name+"/",
                    type: "POST",
                    contentType:'application/json',
                    data: JSON.stringify(data),
                    success: function(data)
                    {
                        thisObj.model.items[data.id] = data
                        def.resolve(data.id)
                    },
                    error:function(e)
                    {
                        def.reject(e)
                    }
                });
            }).fail(function(e)
            {
                def.reject(e)
            })

        }).fail(function(e)
        {
            def.reject(e)
        })


        return def.promise();
    }
})

var pmHosts = inheritance(pmItems)

pmHosts.model.name = "hosts"
pmHosts.model.page_name = "host"
pmHosts.model.bulk_name = "host"
pmHosts.model.className = "pmHosts"

pmHosts.model.page_list = {
    buttons:[
        {
            class:'btn btn-primary',
            function:function(){ return "spajs.open({ menuId:'new-"+this.model.page_name+"'}); return false;"},
            title:'Create',
            link:function(){ return '/?new-'+this.model.page_name},
        },
    ],
    title: "Hosts",
    short_title: "Hosts",
    fileds:[
        {
            title:'Name',
            name:'name',
        },
        {
            title:'Type',
            name:'type',
            style:function(item){ return 'style="width: 70px"'},
            class:function(item){ return 'class="hidden-xs"'},
        }
    ],
    actions:[
        {
            function:function(item){ return 'spajs.showLoader('+this.model.className+'.deleteItem('+item.id+')); return false;'},
            title:'Delete',
            link:function(){ return '#'}
        }
    ]
}

pmHosts.model.page_list_from_another_class = {
    buttons:[
        {
            class:'btn btn-primary',
            function:function(opt){ return "spajs.open({ menuId:'" + opt.link_with_parents + "/" + this.model.name + "/new-" + this.model.page_name + "'}); return false;"},
            title:'Create',
            link:function(){ return '#'},
        }
    ],
    title: "Hosts",
    short_title: "Hosts",
    fileds:[
        {
            title:'Name',
            name:'name',
        },
        {
            title:'Type',
            name:'type',
            style:function(item){ return 'style="width: 70px"'},
            class:function(item){ return 'class="hidden-xs"'},
        }
    ],
    actions:[
        {
            function:function(item, opt){ return 'spajs.showLoader('+this.model.className+'.deleteChildFromParent("' + opt.parent_type + '",' + opt.parent_item + ',' + item.id+')); return false;'},
            title: function(item, opt){return "Delete from " + opt.parent_type;},
            link:function(){ return '#'}
        }
    ],
    actionsOnSelected:[
        {
            function:function(item, opt){ return 'spajs.showLoader('+this.model.className+'.deleteChildrenFromParent("'  +opt.parent_type + '",' + opt.parent_item + ')); return false;'},
            title:function(item, opt){return "Delete all selected from " + opt.parent_type;},
            link:function(){ return '#'}
        },
    ]
}


pmHosts.fileds = [
    [
        {
            filed: new filedsLib.filed.text(),
            title:'Name',
            name:'name',
            placeholder:'Enter host or range name',
            help:'Host or range name',
            validator:function(value)
            {
                if(this.validateRangeName(value) || this.validateHostName(value))
                {
                    return true;
                }

                $.notify("Invalid value in field `name` it mast be valid host or range name", "error");
                return false;
            },
            fast_validator:function(value){ return this.validateRangeName(value) || this.validateHostName(value)}
        },
    ],
    [
        {
            filed: new filedsLib.filed.textarea(),
            title:'Notes',
            name:'notes',
            placeholder:'Not required field, just for your notes'
        },
    ]
]

pmHosts.model.page_new = {
    title: "New host",
    short_title: "New host",
    fileds:pmHosts.fileds,
    sections:[
        function(section){
            return jsonEditor.editor({}, {block:this.model.name});
        }
    ],
    onBeforeSave:function(data)
    {
        if(this.validateHostName(data.name))
        {
            data.type = 'HOST'
        }
        else if(this.validateRangeName(data.name))
        {
            data.type = 'RANGE'
        }
        else
        {
            $.notify("Error in host or range name", "error");
            return undefined;
        }

        data.vars = jsonEditor.jsonEditorGetValues()
        return data;
    },
    onCreate:function(result, status, xhr, callOpt)
    {
        var def = new $.Deferred();
        $.notify("Host created", "success");

        if(callOpt.parent_item)
        {
            var link = window.location.href.split(/[&?]/g)[1];
            var pattern = /([A-z0-9_]+)\/([0-9]+)/g;
            var link_parts = link.match(pattern);
            var link_with_parents = "";
            for(var i in link_parts)
            {
                link_with_parents += link_parts[i] +"/";
            }
            link_with_parents += this.model.name;

            if(callOpt.parent_type == 'group')
            {
                $.when(pmGroups.addSubHosts(callOpt.parent_item, [result.id])).always(function(){
                    $.when(spajs.open({ menuId:link_with_parents})).always(function(){
                        def.resolve()
                    })
                })
            }
            else if(callOpt.parent_type == 'inventory')
            {
                $.when(pmInventories.addSubHosts(callOpt.parent_item, [result.id])).always(function(){
                    $.when(spajs.open({ menuId:link_with_parents})).always(function(){
                        def.resolve()
                    })
                })
            }
            else if(callOpt.parent_type == 'project')
            {
                $.when(pmProjects.addSubHosts(callOpt.parent_item, [result.id])).always(function(){
                    $.when(spajs.open({ menuId:link_with_parents})).always(function(){
                        def.resolve()
                    })
                })
            }
            else
            {
                console.error("Не известный parent_type", callOpt.parent_type)
                $.when(spajs.open({ menuId:"host/"+result.id})).always(function(){
                    def.resolve()
                })
            }
        }
        else
        {
            $.when(spajs.open({ menuId:"host/"+result.id})).always(function(){
                def.resolve()
            })
        }

        return def.promise();
    }
}

pmHosts.model.page_item = {
    buttons:[
        {
            class:'btn btn-primary',
            function:function(item_id){ return 'spajs.showLoader('+this.model.className+'.updateItem('+item_id+'));  return false;'},
            title:'Save',
            link:function(){ return '#'},
        },
        {
            class:'btn btn-default copy-btn',
            function:function(item_id){ return 'spajs.showLoader('+this.model.className+'.copyAndEdit('+item_id+'));  return false;'},
            title:'<span class="glyphicon glyphicon-duplicate" ></span>',
            link:function(){ return '#'},
            help:'Copy'
        },
        {
            class:'btn btn-danger danger-right',
            function:function(item_id){ return 'spajs.showLoader('+this.model.className+'.deleteItem('+item_id+'));  return false;'},
            title:'<span class="glyphicon glyphicon-remove" ></span> <span class="hidden-sm hidden-xs" >Remove</span>',
            link:function(){ return '#'},
        },
    ],
    sections:[
        function(section, item_id){
            return jsonEditor.editor(this.model.items[item_id].vars, {block:this.model.name});
        }
    ],
    title: function(item_id){
        return "Host "+pmHosts.model.items[item_id].justText('name')
    },
    short_title: function(item_id){
        return "Host "+pmHosts.model.items[item_id].justText('name', function(v){return v.slice(0, 20)})
    },
    fileds:pmHosts.fileds,
    onUpdate:function(result)
    {
        return true;
    },
    onBeforeSave:function(data, item_id)
    {
        data.vars = jsonEditor.jsonEditorGetValues()
        if(this.validateHostName(data.name))
        {
            data.type = 'HOST'
        }
        else if(this.validateRangeName(data.name))
        {
            data.type = 'RANGE'
        }
        else
        {
            $.notify("Error in host or range name", "error");
            return undefined;
        }
        return data;
    },
}

pmHosts.model.page_item_from_another_class = {
    buttons:[
        {
            class:'btn btn-primary',
            function:function(item_id){ return 'spajs.showLoader('+this.model.className+'.updateItem('+item_id+'));  return false;'},
            title:'Save',
            link:function(){ return '#'},
        },
        {
            class:'btn btn-warning',
            function:function(item_id, opt){ return 'spajs.showLoader('+this.model.className+'.deleteChildFromParent("'+opt.parent_type+'",'+opt.parent_item+','+item_id+', "'+opt.back_link+'"));  return false;'},
            title:function(item_id, opt){return 'Remove from parent ' +opt.parent_type; },
            link:function(){ return '#'},
        },
        {
            class:'btn btn-danger danger-right',
            function:function(item_id, opt){ return 'spajs.showLoader('+this.model.className+'.deleteItem('+item_id+', false, "' + opt.back_link + '"));  return false;'},
            title:'<span class="glyphicon glyphicon-remove" ></span> <span class="hidden-sm hidden-xs" >Remove</span>',
            link:function(){ return '#'},
        },
    ],
    sections:[
        function(section, item_id){
            return jsonEditor.editor(this.model.items[item_id].vars, {block:this.model.name});
        }
    ],
    title: function(item_id){
        return "Host "+pmHosts.model.items[item_id].justText('name')
    },
    short_title: function(item_id){
        return "Host "+pmHosts.model.items[item_id].justText('name', function(v){return v.slice(0, 20)})
    },
    fileds:pmHosts.fileds,
    onUpdate:function(result)
    {
        return true;
    },
    onBeforeSave:function(data, item_id)
    {
        data.vars = jsonEditor.jsonEditorGetValues()
        if(this.validateHostName(data.name))
        {
            data.type = 'HOST'
        }
        else if(this.validateRangeName(data.name))
        {
            data.type = 'RANGE'
        }
        else
        {
            $.notify("Error in host or range name", "error");
            return undefined;
        }
        return data;
    },
}

pmHosts.copyItem = function(item_id)
{
    var def = new $.Deferred();
    var thisObj = this;

    $.when(this.loadItem(item_id)).done(function()
    {
        var data = thisObj.model.items[item_id];
        $.when(encryptedCopyModal.replace(data)).done(function(data)
        {
            delete data.id;
            spajs.ajax.Call({
                url: hostname + "/api/v2/"+thisObj.model.name+"/",
                type: "POST",
                contentType:'application/json',
                data: JSON.stringify(data),
                success: function(data)
                {
                    thisObj.model.items[data.id] = data
                    def.resolve(data.id)
                },
                error:function(e)
                {
                    def.reject(e)
                }
            });
        }).fail(function(e)
        {
            def.reject(e)
        })

    }).fail(function(e)
    {
        def.reject(e)
    })


    return def.promise();
}


/*
 * 
detail:"database is locked"
error_type:"OperationalError"
 * 
for(var i =0; i< 10000; i++)
{
setTimeout(function(){
    name = Math.random()+"-"+Math.random()
    name = name.replace(/\./g, "")
    spajs.ajax.Call({
            url: hostname + "/api/v2/hosts/",
            type: "POST",
            contentType:'application/json',
            data: JSON.stringify({name:name, type:"HOST"}),
                })
}, i*400);
}
 */

tabSignal.connect("polemarch.start", function()
{
    // hosts
    /*
    spajs.addMenu({
        id:"hosts",
        urlregexp:[/^hosts$/, /^host$/, /^hosts\/search\/?$/, /^hosts\/page\/([0-9]+)$/],
        onOpen:function(holder, menuInfo, data){return pmHosts.showList(holder, menuInfo, data);}
    })

    spajs.addMenu({
        id:"hosts-search",
        urlregexp:[/^hosts\/search\/([A-z0-9 %\-.:,=]+)$/, /^hosts\/search\/([A-z0-9 %\-.:,=]+)\/page\/([0-9]+)$/],
        onOpen:function(holder, menuInfo, data){return pmHosts.showSearchResults(holder, menuInfo, data);}
    })

    spajs.addMenu({
        id:"host",
        urlregexp:[/^host\/([0-9]+)$/, /^hosts\/([0-9]+)$/],
        onOpen:function(holder, menuInfo, data){return pmHosts.showItem(holder, menuInfo, data);}
    })

    spajs.addMenu({
        id:"newHost",
        urlregexp:[/^new-host$/, /^([A-z0-9_]+)\/([0-9]+)\/new-host$/,
            /^([A-z0-9_]+)\/([0-9]+)\/hosts\/new-host$/, /^([A-z0-9_\/]+)\/hosts\/new-host$/],
        onOpen:function(holder, menuInfo, data){return pmHosts.showNewItemPage(holder, menuInfo, data);}
    })

    spajs.addMenu({
        id:"host-from-another-model",
        urlregexp:[/^([A-z0-9_\/]+)\/host\/([0-9]+)$/, /^([A-z0-9_\/]+)\/hosts\/([0-9]+)$/],
        onOpen:function(holder, menuInfo, data){return pmHosts.showItemFromAnotherClass(holder, menuInfo, data);}
    })

    spajs.addMenu({
        id:"some-model-hosts",
        urlregexp:[/^([A-z0-9_\/]+)\/hosts$/, /^([A-z0-9_\/]+)\/hosts\/search\/?$/,
            /^([A-z0-9_\/]+)\/host$/, /^([A-z0-9_\/]+)\/hosts\/page\/([0-9]+)$/],
        onOpen:function(holder, menuInfo, data){return pmHosts.showListFromAnotherClass(holder, menuInfo, data);}
    })

    spajs.addMenu({
        id:"some-model-hosts-search",
        urlregexp:[/^([A-z0-9_\/]+)\/hosts\/search\/([A-z0-9 %\-.:,=]+)$/,
            /^([A-z0-9_\/]+)\/hosts\/search\/([A-z0-9 %\-.:,=]+)\/page\/([0-9]+)$/],
        onOpen:function(holder, menuInfo, data){return pmHosts.showSearchResultsForParent(holder, menuInfo, data);}
    })*/
})

//изменение типа input'a на file при выборе