gui_project_template = {

    getValue : function (hideReadOnly)
    {
        let arr_data_fields = [];

        let template_data = gui_base_object.getValue.apply(this, arguments);
        let data_field = {};

        if(template_data.data)
        {
            data_field = JSON.parse(template_data.data);
        }

        if(template_data.kind.toLowerCase() == 'module')
        {
            arr_data_fields = ['module', 'args', 'inventory', 'group', 'vars'];
        }
        else
        {
            arr_data_fields = ['playbook', 'inventory', 'vars'];
        }

        arr_data_fields.forEach(function(value)
        {
            if(template_data[value])
            {
                data_field[value] = template_data[value];
                delete template_data[value];
            }
            else
            {
                data_field[value] = "";

                if(value == 'vars')
                {
                    data_field[value] = {};
                }
            }

        })

        template_data.data = JSON.stringify(data_field);

        return template_data;
    },

    prepareDataBeforeRender: function()
    {
        let template_data = this.model.data;
        let arr_data_fields = [];
        if(template_data)
        {
            if(template_data.kind.toLowerCase() == 'module')
            {
                arr_data_fields = ['module', 'args', 'inventory', 'group']
            }
            else
            {
                arr_data_fields = ['playbook', 'inventory'];
            }

            arr_data_fields.forEach(function(value)
            {
                template_data[value] = template_data.data[value];
            })
        }

        return template_data;
    }

}


gui_project_template_variables = {

    apiGetDataForQuery : function (query, variable)
    {
        if(variable)
        {
            if(query.method == "get")
            {
                let res =  {
                    "status": 200,
                    "item": "variables",
                    "type": "mod",
                    "data": {},
                    "subitem": [
                        "1",
                        "template"
                    ]
                }

                let val = this.parent_template.model.data.data['vars'];
                res.data = {
                    "key": variable,
                    "value": val[variable],
                }

                return res;
            }

            if(query.method == "put")
            {
                let template_data = this.parent_template.model.data

                let vars = template_data.data['vars'];

                if(!vars)
                {
                    vars = {};
                }

                vars[query.data.key] = query.data.value;

                return this.parent_template.sendToApi("patch", undefined, undefined, template_data)
            }
        }
        else
        {
            if(query.method == "get")
            {
                let res =  {
                    "status": 200,
                    "item": "variables",
                    "type": "mod",
                    "data": {
                        "count": 1,
                        "next": null,
                        "previous": null,
                        "results": [ ]
                    },
                    "subitem": [
                        "1",
                        "template"
                    ]
                }

                let vars = this.parent_template.model.data.data['vars'];
                for(let i in vars)
                {
                    let val = vars[i]
                    res.data.results.push({
                        "id": i,
                        "key": i,
                        "value": vars[i],
                    })
                }
                res.data.count = res.data.results.length
                return res;
            }

            if(query.method == "post")
            {
                let template_data = this.parent_template.model.data

                let vars = template_data.data['vars'];

                if(!vars)
                {
                    vars = {};
                }

                vars[query.data.key] = query.data.value;

                return this.parent_template.sendToApi("patch", undefined, undefined, template_data)
            }
        }
    },

    apiQuery : function (query)
    {
        let variable;
        if(query.data_type[query.data_type.length-1] != 'variables')
        {
            variable = query.data_type[query.data_type.length-1];
        }
        let def = new $.Deferred();

        this.parent_template = new guiObjectFactory("/project/{pk}/template/{template_id}/")
        $.when(this.parent_template.load(query.data_type[3])).done(() =>{

            $.when(this.apiGetDataForQuery(query, variable)).done((d) =>{
                def.resolve(d)
            }).fail((e) =>{
                def.reject(e);
            })

        }).fail((e) =>{
            def.reject(e);
        })

        return def.promise();
    },

    delete: function()
    {
        let url_info = spajs.urlInfo.data.reg;
        this.parent_template = new guiObjectFactory("/project/{pk}/template/{template_id}/");

        let def = new $.Deferred();

        $.when(this.parent_template.load(url_info.api_template_id)).done((data) =>{
            let template_data = data.data;
            delete template_data.data.vars[url_info.api_variables_id]
            def.resolve(this.parent_template.sendToApi("patch", undefined, undefined, template_data))
        }).fail((e) =>{
            def.reject(e);
        })

        return def.promise();
    },

    deleteArray : function (ids)
    {
        let url_info = spajs.urlInfo.data.reg;
        this.parent_template = new guiObjectFactory("/project/{pk}/template/{template_id}/");

        let def = new $.Deferred();

        $.when(this.parent_template.load(url_info.api_template_id)).done((data) =>{
            let template_data = data.data;
            for(let i in ids)
            {
                let id = ids[i];
                delete template_data.data.vars[id];
            }
            guiPopUp.success("Objects of '"+this.api.bulk_name+"' type were successfully deleted");
            def.resolve(this.parent_template.sendToApi("patch", undefined, undefined, template_data))
        }).fail((e) =>{
            def.reject(e);
        })

        return def.promise();
    },
}

gui_project_template_option = {

    apiGetDataForQuery : function (query, option)
    {
        if(option)
        {
            if(query.method == "get")
            {
                let res =  {
                    "status": 200,
                    "item": "option",
                    "type": "mod",
                    "data": {},
                    "subitem": [
                        "1",
                        "template"
                    ]
                }

                let val = this.parent_template.model.data.options[option];

                res.data = { }
                for(let i in gui_project_template_option_Schema)
                {
                    res.data[i] = val[i]
                }

                /*res.data = {
                    "id": option,
                    "name": val.name || option,
                    "notes": val.notes
                }*/

                return res;
            }

            if(query.method == "put")
            {
                let template_data = this.parent_template.model.data

                if(query.data.name)
                {
                    query.data.name = query.data.name.replace(/[\s\/]+/g,'_');
                }

                if(option != query.data.name)
                {
                    template_data.options[query.data.name] = template_data.options[option];
                    delete template_data.options[option];
                }

                for(let field in query.data)
                {
                    template_data.options[query.data.name][field] = query.data[field];
                }

                if(template_data.options[query.data.name].name)
                {
                    template_data.options[query.data.name].name.replace(/[\s\/]+/g,'_');
                }

                return this.parent_template.sendToApi("patch", undefined, undefined, template_data)
            }
        }
        else
        {
            if(query.method == "get")
            {
                let res =  {
                    "status": 200,
                    "item": "option",
                    "type": "mod",
                    "data": {
                        "count": 1,
                        "next": null,
                        "previous": null,
                        "results": [ ]
                    },
                    "subitem": [
                        "1",
                        "template"
                    ]
                }

                for(let i in this.parent_template.model.data.options)
                {
                    let val = this.parent_template.model.data.options[i]
                    res.data.results.push({
                        "id": i,
                        "name": val.name || i,
                    })
                }
                res.data.count = res.data.results.length
                return res;
            }

            if(query.method == "post")
            {
                let template_data = this.parent_template.model.data
                if(query.data.name)
                {
                    query.data.name = query.data.name.replace(/[\s\/]+/g,'_');
                }
                if(template_data.options[query.data.name])
                {
                    guiPopUp.error('Option with "' + query.data.name + '" name exists already');
                    return undefined;
                }

                template_data.options[query.data.name] = query.data

                return this.parent_template.sendToApi("patch", undefined, undefined, template_data)
            }
        }
    },

    apiQuery : function (query)
    {
        let option;
        if(query.data_type[query.data_type.length-1] != 'option' && query.data_type.length == 6)
        {
            option = query.data_type[query.data_type.length-1];
        }
        let def = new $.Deferred();

        this.parent_template = new guiObjectFactory("/project/{pk}/template/{template_id}/")
        $.when(this.parent_template.load(query.data_type[3])).done(() =>{

            $.when(this.apiGetDataForQuery(query, option)).done((d) =>{
                def.resolve(d)
            }).fail((e) =>{
                def.reject(e);
            })

        }).fail((e) =>{
            def.reject(e);
        })

        return def.promise();
    },

    delete: function()
    {
        let url_info = spajs.urlInfo.data.reg;
        this.parent_template = new guiObjectFactory("/project/{pk}/template/{template_id}/");

        let def = new $.Deferred();

        $.when(this.parent_template.load(url_info.api_template_id)).done((data) =>{
            let template_data = data.data;
            delete template_data.options[url_info.api_option_id]
            def.resolve(this.parent_template.sendToApi("patch", undefined, undefined, template_data))
        }).fail((e) =>{
            def.reject(e);
        })

        return def.promise();
    },

    deleteArray : function (ids)
    {
        let url_info = spajs.urlInfo.data.reg;
        this.parent_template = new guiObjectFactory("/project/{pk}/template/{template_id}/");

        let def = new $.Deferred();

        $.when(this.parent_template.load(url_info.api_template_id)).done((data) =>{
            let template_data = data.data;
            for(let i in ids)
            {
                let id = ids[i];
                delete template_data.options[id];
            }
            guiPopUp.success("Objects of '"+this.api.bulk_name+"' type were successfully deleted");
            def.resolve(this.parent_template.sendToApi("patch", undefined, undefined, template_data))
        }).fail((e) =>{
            def.reject(e);
        })

        return def.promise();
    },
}

gui_project_template_option_variables = {

    apiGetDataForQuery : function (query, variable)
    {
        if(variable)
        {
            if(query.method == "get")
            {
                let res =  {
                    "status": 200,
                    "item": "option",
                    "type": "mod",
                    "data": {},
                    "subitem": [
                        "1",
                        "template"
                    ]
                }

                let val = this.parent_template.model.data.options[query.data_type[5]];
                res.data = {
                    "key": variable,
                    "value": val.vars[variable],
                }

                return res;
            }

            if(query.method == "put")
            {
                let template_data = this.parent_template.model.data

                let option_data = template_data.options[query.data_type[5]];

                if(!option_data.vars)
                {
                    option_data.vars = {};
                }

                option_data.vars[query.data.key] = query.data.value;

                return this.parent_template.sendToApi("patch", undefined, undefined, template_data)
            }
        }
        else
        {
            if(query.method == "get")
            {
                let res =  {
                    "status": 200,
                    "item": "option",
                    "type": "mod",
                    "data": {
                        "count": 1,
                        "next": null,
                        "previous": null,
                        "results": [ ]
                    },
                    "subitem": [
                        "1",
                        "template"
                    ]
                }

                let option_data = this.parent_template.model.data.options[query.data_type[5]];
                for(let i in option_data.vars)
                {
                    let val = option_data.vars[i]
                    res.data.results.push({
                        "id": i,
                        "key": i,
                        "value": option_data.vars[i],
                    })
                }
                res.data.count = res.data.results.length
                return res;
            }

            if(query.method == "post")
            {
                let template_data = this.parent_template.model.data

                let option_data = template_data.options[query.data_type[5]];

                if(!option_data.vars)
                {
                    option_data.vars = {};
                }

                option_data.vars[query.data.key] = query.data.value;

                return this.parent_template.sendToApi("patch", undefined, undefined, template_data)
            }
        }
    },

    apiQuery : function (query)
    {
        let variable;
        if(query.data_type[query.data_type.length-1] != 'variables')
        {
            variable = query.data_type[query.data_type.length-1];
        }
        let def = new $.Deferred();

        this.parent_template = new guiObjectFactory("/project/{pk}/template/{template_id}/")
        $.when(this.parent_template.load(query.data_type[3])).done(() =>{

            $.when(this.apiGetDataForQuery(query, variable)).done((d) =>{
                def.resolve(d)
            }).fail((e) =>{
                def.reject(e);
            })

        }).fail((e) =>{
            def.reject(e);
        })

        return def.promise();
    },

    delete: function()
    {
        let url_info = spajs.urlInfo.data.reg;
        this.parent_template = new guiObjectFactory("/project/{pk}/template/{template_id}/");

        let def = new $.Deferred();

        $.when(this.parent_template.load(url_info.api_template_id)).done((data) =>{
            let template_data = data.data;
            delete template_data.options[url_info.api_option_id].vars[url_info.api_variables_id]
            def.resolve(this.parent_template.sendToApi("patch", undefined, undefined, template_data))
        }).fail((e) =>{
            def.reject(e);
        })

        return def.promise();
    },

    deleteArray : function (ids)
    {
        let url_info = spajs.urlInfo.data.reg;
        this.parent_template = new guiObjectFactory("/project/{pk}/template/{template_id}/");

        let def = new $.Deferred();

        $.when(this.parent_template.load(url_info.api_template_id)).done((data) =>{
            let template_data = data.data;
            for(let i in ids)
            {
                let id = ids[i];
                delete template_data.options[url_info.api_option_id].vars[id];
            }
            guiPopUp.success("Objects of '"+this.api.bulk_name+"' type were successfully deleted");
            def.resolve(this.parent_template.sendToApi("patch", undefined, undefined, template_data))
        }).fail((e) =>{
            def.reject(e);
        })

        return def.promise();
    },
}

gui_project_template_option_Schema = {
    "name": {
        "title": "Name",
        "type": "string",
        "maxLength": 512,
        "minLength": 1,
        "gui_links": [],
        "definition": {},
        "name": "name",
        "parent_name_format": "option_name"
    },
    "group": {
        "title": "Group",
        "type": "string",
        "maxLength": 512,
        "minLength": 1,
        "gui_links": [],
        "definition": {},
        "name": "group",
        "parent_name_format": "option_group",
        format:"autocomplete",
        dynamic_properties:{
            list_obj:projPath + "/group/",
            value_field:'name',
            view_field:'name',
        },
    },
    "module": {
        "title": "Module",
        "type": "string",
        "maxLength": 512,
        "minLength": 1,
        "gui_links": [],
        "definition": {},
        "name": "module",
        format:"autocomplete",
        dynamic_properties:{
            list_obj:projPath + "/module/",
            value_field:'path',
            view_field:'path',
        },
        "parent_name_format": "option_module"
    },
    "args": {
        "title": "Args",
        "type": "string",
        "maxLength": 512,
        "minLength": 1,
        "gui_links": [],
        "definition": {},
        "name": "args",
        "parent_name_format": "option_args"
    },
    "notes": {
        "title": "Notes",
        "type": "string",
        "format": "textarea",
        "gui_links": [],
        "definition": {},
        "name": "notes",
        "parent_name_format": "option_notes"
    },
}

gui_project_template_option_variables_fields_Schema = {
    "key": {
        "title": "Key",
        "type": "dynamic",
        "dynamic_properties": {},
        "required": true,
        "__func__onInit": "TemplateVariable_key_onInit",
        "gui_links": [],
        "definition": {},
        "name": "key",
        "parent_name_format": "variables_key"
    },
    "value": {
        "title": "Value",
        "type": "dynamic",
        "dynamic_properties": {"__func__callback": "TemplateVariable_value_callback",},
        "required": true,
        "default": "",
        "gui_links": [],
        "definition": {},
        "name": "value",
        "parent_name_format": "variables_value",
        "parent_field":"key"
    }
}

let api_error_responses = {
    "400": {
        "description": "Validation error or some data error.",
        "schema": {
            "required": [
                "detail"
            ],
            "type": "object",
            "properties": {
                "detail": {
                    "title": "Detail",
                    "type": "string",
                    "minLength": 1,
                    "required": true
                }
            },
            "definition_name": "Error",
            "definition_ref": "#/definitions/Error"
        }
    },
    "401": {
        "description": "Unauthorized access error.",
        "schema": {
            "required": [
                "detail"
            ],
            "type": "object",
            "properties": {
                "detail": {
                    "title": "Detail",
                    "type": "string",
                    "minLength": 1,
                    "required": true
                }
            },
            "definition_name": "Error",
            "definition_ref": "#/definitions/Error"
        }
    },
    "403": {
        "description": "Permission denied error.",
        "schema": {
            "required": [
                "detail"
            ],
            "type": "object",
            "properties": {
                "detail": {
                    "title": "Detail",
                    "type": "string",
                    "minLength": 1,
                    "required": true
                }
            },
            "definition_name": "Error",
            "definition_ref": "#/definitions/Error"
        }
    },
    "404": {
        "description": "Not found error.",
        "schema": {
            "required": [
                "detail"
            ],
            "type": "object",
            "properties": {
                "detail": {
                    "title": "Detail",
                    "type": "string",
                    "minLength": 1,
                    "required": true
                }
            },
            "definition_name": "Error",
            "definition_ref": "#/definitions/Error"
        }
    }
}

tabSignal.connect("openapi.schema", function(obj) {
    // Модификация схемы до сохранения в кеш.
    obj.schema.path["/project/{pk}/template/{template_id}/variables/"] = {
        "level": 6,
        "path": "/project/{pk}/template/{template_id}/variables/",
        "type": "list",
        "name": "variables",
        "bulk_name": "variables",
        "name_field": "name",
        "method": {
            "get": "list",
            "patch": "",
            "put": "",
            "post": "new",
            "delete": "",
        },
        "buttons": [],
        "short_name": "project/template/variables",
        "hide_non_required": 4,
        "extension_class_name": [
            "gui_project_template_variables"
        ],
        "selectionTag": "_project__pk__template__template_id__variables_",
        "methodAdd": "post",
        "canAdd": false,
        "canRemove": false,
        "canCreate": true,
        "schema": {
            "list": {
                "fields": gui_project_template_option_variables_fields_Schema,
                "filters": { },
                "query_type": "get",
                "operationId": "project_template_variables_list",
                "responses": {
                    "200": {
                        "description": "Action accepted.",
                        "schema": {
                            "required": [
                                "key"
                            ],
                            "type": "object",
                            "properties": gui_project_template_option_variables_fields_Schema,
                            "definition_name": "TemplateVariable",
                            "definition_ref": "#/definitions/TemplateVariable"
                        }
                    },
                    "400": api_error_responses["400"],
                    "401": api_error_responses["401"],
                    "403": api_error_responses["403"],
                    "404": api_error_responses["404"]
                }
            },
            "new": {
                "fields": gui_project_template_option_variables_fields_Schema,
                "query_type": "post",
                "operationId": "project_template_variables_add",
                "responses": {
                    "201": {
                        "description": "Action accepted.",
                        "schema": {
                            "required": [
                                "key"
                            ],
                            "type": "object",
                            "properties": gui_project_template_option_variables_fields_Schema,
                            "definition_name": "TemplateVariable",
                            "definition_ref": "#/definitions/TemplateVariable"
                        }
                    },
                    "400": api_error_responses["400"],
                    "401": api_error_responses["401"],
                    "403": api_error_responses["403"],
                    "404": api_error_responses["404"]
                }
            }
        },
        "__link__page": "/project/{pk}/template/{template_id}/variables/{variables_id}/",
        "page_path": "/project/{pk}/template/{template_id}/variables/{variables_id}/",
        "sublinks": [],
        "sublinks_l2": [],
        "actions": {},
        "links": {},
        "multi_actions":{
            "delete": {
                "name":"delete",
                "__func__onClick": "multi_action_delete",
            }
        },
        "__link__parent": "/project/{pk}/template/{template_id}/",
        "parent_path": "/project/{pk}/template/{template_id}/"
    }

    obj.schema.path["/project/{pk}/template/{template_id}/variables/{variables_id}/"] = {
        "level": 7,
        "path": "/project/{pk}/template/{template_id}/variables/{variables_id}/",
        "type": "page",
        "name": "variables",
        "bulk_name": "variables",
        "name_field": "name",
        "method": {
            "get": "page",
            "patch": "edit",
            "put": "edit",
            "post": "",
            "delete": ""
        },
        "buttons": [],
        "short_name": "project/template/variables",
        "hide_non_required": 4,
        "extension_class_name": [
            "gui_project_template_variables"
        ],
        "methodEdit": "put",
        "selectionTag": "_project__pk__template__template_id__variables__variables_id__",
        "canDelete": true,
        "methodDelete": "delete",
        "canEdit": true,
        "schema": {
            "get": {
                "fields": gui_project_template_option_variables_fields_Schema,
                "filters": {},
                "query_type": "get",
                "operationId": "project_template_variables_get",
                "responses": {
                    "200": {
                        "description": "Action accepted.",
                        "schema": {
                            "required": [
                                "key"
                            ],
                            "type": "object",
                            "properties": gui_project_template_option_variables_fields_Schema,
                            "definition_name": "TemplateVariable",
                            "definition_ref": "#/definitions/TemplateVariable"
                        }
                    },
                    "400": api_error_responses["400"],
                    "401": api_error_responses["401"],
                    "403": api_error_responses["403"],
                    "404": api_error_responses["404"]
                }
            },
            "edit": {
                "fields": gui_project_template_option_variables_fields_Schema,
                "query_type": "patch",
                "operationId": "project_template_variables_edit",
                "responses": {
                    "200": {
                        "description": "Action accepted.",
                        "schema": {
                            "required": [
                                "key"
                            ],
                            "type": "object",
                            "properties": {
                                // "id": {
                                //     "title": "Id",
                                //     "type": "string",
                                //     "readOnly": true
                                // },
                                "key": {
                                    "title": "Key",
                                    "type": "dynamic",
                                    "dynamic_properties": {},
                                    "required": true,
                                    "__func__onInit": "TemplateVariable_key_onInit",
                                    "gui_links": [],
                                    "definition": {},
                                    "name": "key",
                                    "parent_name_format": "variables_key"
                                },
                                "value": {
                                    "title": "Value",
                                    "type": "dynamic",
                                    "dynamic_properties": {},
                                    "required": true,
                                    "__func__callback": "TemplateVariable_value_callback",
                                    "default": "",
                                    "gui_links": [],
                                    "definition": {},
                                    "name": "value",
                                    "parent_name_format": "variables_value"
                                }
                            },
                            "definition_name": "TemplateVariable",
                            "definition_ref": "#/definitions/TemplateVariable"
                        }
                    },
                    "400": api_error_responses["400"],
                    "401": api_error_responses["401"],
                    "403": api_error_responses["403"],
                    "404": api_error_responses["404"]
                }
            }
        },
        "__link__list": "/project/{pk}/template/{template_id}/variables/",
        "list_path": "/project/{pk}/template/{template_id}/variables/",
        "sublinks": [],
        "sublinks_l2": [],
        "actions": {},
        "links": {},
        "multi_actions": [],
        "__link__parent": "/project/{pk}/template/{template_id}/variables/",
        "parent_path": "/project/{pk}/template/{template_id}/variables/"
    };

    obj.schema.path["/project/{pk}/template/{template_id}/option/"] = {
        "level": 6,
        "path": "/project/{pk}/template/{template_id}/option/",
        "type": "list",
        "name": "option",
        "bulk_name": "option",
        "name_field": "name",
        "buttons": [],
        "short_name": "project/template/option",
        "hide_non_required": 4,
        "extension_class_name": [
            "gui_project_template_option"
        ],
        "selectionTag": "_project__pk__template__template_id__option_",
        "methodAdd": "post",
        "canAdd": false,
        "canRemove": false,
        "canCreate": true,
        "method": {'get': 'list', 'patch': '', 'put': '', 'post': 'new', 'delete': ''},
        "schema": {
            "list": {
                "fields": {
                    "name": {
                        "title": "Name",
                        "type": "string",
                        "maxLength": 512,
                        "minLength": 1,
                        "gui_links": [],
                        "definition": {},
                        "name": "name",
                        "parent_name_format": "option_name"
                    },
                },
                "filters": {},
                "query_type": "get",
                "operationId": "project_template_option_list",
                "responses": {
                    "200": {
                        "description": "Action accepted.",
                        "schema": {
                            "type": "object",
                            "properties": {
                                "id": {
                                    "title": "Id",
                                    "type": "integer",
                                    "readOnly": true
                                },
                                "name": {
                                    "title": "Name",
                                    "type": "string",
                                    "maxLength": 512,
                                    "minLength": 1
                                },
                            },
                            "definition_name": "Option",
                            "definition_ref": "#/definitions/Option"
                        }
                    },
                    "400": api_error_responses["400"],
                    "401": api_error_responses["401"],
                    "403": api_error_responses["403"],
                    "404": api_error_responses["404"]
                }
            },
            "new": {
                "fields": gui_project_template_option_Schema,
                "query_type": "post",
                "operationId": "project_template_option_add",
                "responses": {
                    "201": {
                        "description": "Action accepted.",
                        "schema": {
                            "type": "object",
                            "properties": gui_project_template_option_Schema,
                            "definition_name": "OneOption",
                            "definition_ref": "#/definitions/OneOption"
                        }
                    },
                    "400": api_error_responses["400"],
                    "401": api_error_responses["401"],
                    "403": api_error_responses["403"],
                    "404": api_error_responses["404"]
                }
            }
        },
        "__link__page": "/project/{pk}/template/{template_id}/option/{option_id}/",
        "page_path": "/project/{pk}/template/{template_id}/option/{option_id}/",
        "sublinks": [],
        "sublinks_l2": [],
        "actions": {},
        "links": {},
        "multi_actions":{
            "delete": {
                "name":"delete",
                "__func__onClick": "multi_action_delete",
            }
        },
        "__link__parent": "/project/{pk}/template/{template_id}/",
        "parent_path": "/project/{pk}/template/{template_id}/"
    }


    obj.schema.path["/project/{pk}/template/{template_id}/option/{option_id}/"] = {
        "level": 7,
        "path": "/project/{pk}/template/{template_id}/option/{option_id}/",
        "type": "page",
        "name": "option",
        "bulk_name": "option",
        "name_field": "name",
        "method": {
            "get": "page",
            "patch": "edit",
            "put": "edit",
            "post": "",
            "delete": ""
        },
        "buttons": [],
        "short_name": "project/template/option",
        "hide_non_required": 4,
        "extension_class_name": [
            "gui_project_template_option"
        ],
        "methodEdit": "put",
        "selectionTag": "_project__pk__template__template_id__option__option_id__",
        "canDelete": true,
        "methodDelete": "delete",
        "canEdit": true,
        "schema": {
            "get": {
                "fields": gui_project_template_option_Schema,
                "filters": {},
                "query_type": "get",
                "operationId": "project_template_option_get",
                "responses": {
                    "200": {
                        "description": "Action accepted.",
                        "schema": {
                            "type": "object",
                            "properties": gui_project_template_option_Schema,
                            "definition_name": "OneOption",
                            "definition_ref": "#/definitions/OneOption"
                        }
                    },
                    "400": api_error_responses["400"],
                    "401": api_error_responses["401"],
                    "403": api_error_responses["403"],
                    "404": api_error_responses["404"]
                }
            },
            "edit": {
                "fields": gui_project_template_option_Schema,
                "query_type": "patch",
                "operationId": "project_template_option_edit",
                "responses": {
                    "200": {
                        "description": "Action accepted.",
                        "schema": {
                            "type": "object",
                            "properties": gui_project_template_option_Schema,
                            "definition_name": "OneOption",
                            "definition_ref": "#/definitions/OneOption"
                        }
                    },
                    "400": api_error_responses["400"],
                    "401": api_error_responses["401"],
                    "403": api_error_responses["403"],
                    "404": api_error_responses["404"]
                }
            }
        },
        "__link__list": "/project/{pk}/template/{template_id}/option/",
        "list_path": "/project/{pk}/template/{template_id}/option/",
        "sublinks": [],
        "sublinks_l2": [],
        "actions": {},
        "links": {
            "__link__variables": "/project/{pk}/template/{template_id}/option/{option_id}/variables/",
        },
        "multi_actions": [],
        "__link__parent": "/project/{pk}/template/{template_id}/option/",
        "parent_path": "/project/{pk}/template/{template_id}/option/"
    }

    obj.schema.path["/project/{pk}/template/{template_id}/option/{option_id}/variables/"] = {
        "level": 8,
        "path": "/project/{pk}/template/{template_id}/option/{option_id}/variables/",
        "type": "list",
        "name": "variables",
        "bulk_name": "variables",
        "name_field": "name",
        "method": {
            "get": "list",
            "patch": "",
            "put": "",
            "post": "new",
            "delete": "",
            // "new": "post"
        },
        "buttons": [],
        "short_name": "project/template/option/variables",
        "hide_non_required": 4,
        "extension_class_name": [
            "gui_project_template_option_variables"
        ],
        "selectionTag": "_project__pk__template__template_id__option__option_id__variables_",
        "methodAdd": "post",
        "canAdd": false,
        "canRemove": false,
        "canCreate": true,
        "schema": {
            "list": {
                "fields": gui_project_template_option_variables_fields_Schema,
                "filters": { },
                "query_type": "get",
                "operationId": "project_template_option_variables_list",
                "responses": {
                    "200": {
                        "description": "Action accepted.",
                        "schema": {
                            "required": [
                                "key"
                            ],
                            "type": "object",
                            "properties": gui_project_template_option_variables_fields_Schema,
                            "definition_name": "TemplateVariable",
                            "definition_ref": "#/definitions/TemplateVariable"
                        }
                    },
                    "400": api_error_responses["400"],
                    "401": api_error_responses["401"],
                    "403": api_error_responses["403"],
                    "404": api_error_responses["404"]
                }
            },
            "new": {
                "fields": gui_project_template_option_variables_fields_Schema,
                "query_type": "post",
                "operationId": "project_template_option_variables_add",
                "responses": {
                    "201": {
                        "description": "Action accepted.",
                        "schema": {
                            "required": [
                                "key"
                            ],
                            "type": "object",
                            "properties": gui_project_template_option_variables_fields_Schema,
                            "definition_name": "TemplateVariable",
                            "definition_ref": "#/definitions/TemplateVariable"
                        }
                    },
                    "400": api_error_responses["400"],
                    "401": api_error_responses["401"],
                    "403": api_error_responses["403"],
                    "404": api_error_responses["404"]
                }
            }
        },
        "__link__page": "/project/{pk}/template/{template_id}/option/{option_id}/variables/{variables_id}/",
        "page_path": "/project/{pk}/template/{template_id}/option/{option_id}/variables/{variables_id}/",
        "sublinks": [],
        "sublinks_l2": [],
        "actions": {},
        "links": {},
        "multi_actions":{
            "delete": {
                "name":"delete",
                "__func__onClick": "multi_action_delete",
            }
        },
        "__link__parent": "/project/{pk}/template/{template_id}/option/{option_id}/",
        "parent_path": "/project/{pk}/template/{template_id}/option/{option_id}/"
    }

    obj.schema.path["/project/{pk}/template/{template_id}/option/{option_id}/variables/{variables_id}/"] = {
        "level": 9,
        "path": "/project/{pk}/template/{template_id}/option/{option_id}/variables/{variables_id}/",
        "type": "page",
        "name": "variables",
        "bulk_name": "variables",
        "name_field": "name",
        "method": {
            "get": "page",
            "patch": "edit",
            "put": "edit",
            "post": "",
            "delete": ""
        },
        "buttons": [],
        "short_name": "project/template/option/variables",
        "hide_non_required": 4,
        "extension_class_name": [
            "gui_project_template_option_variables"
        ],
        "methodEdit": "put",
        "selectionTag": "_project__pk__template__template_id__option__option_id__variables__variables_id__",
        "canDelete": true,
        "methodDelete": "delete",
        "canEdit": true,
        "schema": {
            "get": {
                "fields": gui_project_template_option_variables_fields_Schema,
                "filters": {},
                "query_type": "get",
                "operationId": "project_template_option_variables_get",
                "responses": {
                    "200": {
                        "description": "Action accepted.",
                        "schema": {
                            "required": [
                                "key"
                            ],
                            "type": "object",
                            "properties": gui_project_template_option_variables_fields_Schema,
                            "definition_name": "TemplateVariable",
                            "definition_ref": "#/definitions/TemplateVariable"
                        }
                    },
                    "400": api_error_responses["400"],
                    "401": api_error_responses["401"],
                    "403": api_error_responses["403"],
                    "404": api_error_responses["404"]
                }
            },
            "edit": {
                "fields": gui_project_template_option_variables_fields_Schema,
                "query_type": "patch",
                "operationId": "project_template_option_variables_edit",
                "responses": {
                    "200": {
                        "description": "Action accepted.",
                        "schema": {
                            "required": [
                                "key"
                            ],
                            "type": "object",
                            "properties": gui_project_template_option_variables_fields_Schema,
                            "definition_name": "TemplateVariable",
                            "definition_ref": "#/definitions/TemplateVariable"
                        }
                    },
                    "400": api_error_responses["400"],
                    "401": api_error_responses["401"],
                    "403": api_error_responses["403"],
                    "404": api_error_responses["404"]
                }
            }
        },
        "__link__list": "/project/{pk}/template/{template_id}/option/{option_id}/variables/",
        "list_path": "/project/{pk}/template/{template_id}/option/{option_id}/variables/",
        "sublinks": [],
        "sublinks_l2": [],
        "actions": {},
        "links": {},
        "multi_actions": [],
        "__link__parent": "/project/{pk}/template/{template_id}/option/{option_id}/variables/",
        "parent_path": "/project/{pk}/template/{template_id}/option/{option_id}/variables/"
    };

})

function OneTemplate_args_callback(fieldObj, newValue)
{
    let obj = {}

    if(newValue.value.toLowerCase() == "module")
    {
        obj.type = "string";
    }
    else
    {
        obj.type = "null";
    }
    return obj

}

function OneTemplate_group_callback(fieldObj, newValue)
{
    let obj = {
        type:"select2"
    }
    if(newValue.value.toLowerCase() == "module")
    {
        obj.override_opt = {
            dynamic_properties:{
                list_obj:projPath + "/group/",
                // list_obj:projPath + "/inventory/{inventory_id}/group/",
                value_field:'id',
                view_field:'name',
            }
        };
    }
    else
    {
        obj.type = "null"
    }
    return obj
}

function OneTemplate_module_callback(fieldObj, newValue)
{
    let obj = {
        type:"select2"
    }
    if(newValue.value.toLowerCase() == "module")
    {
        obj.override_opt = {
            dynamic_properties:{
                list_obj:projPath + "/module/",
                value_field:'path',
                view_field:'path',
            },
        };
    }
    else
    {
        obj.type = "null"
    }
    return obj
}

function OneTemplate_playbook_callback(fieldObj, newValue)
{
    let obj = {
        type:"select2"
    }
    if(newValue.value.toLowerCase() == "task")
    {
        obj.override_opt = {
            dynamic_properties:{
                list_obj:projPath + "/playbook/",
                value_field:'id',
                view_field:'name',
            }
        };
        obj.required = true;
    }
    else
    {
        obj.type = "null"
    }
    return obj
}

function OneTemplate_inventory_callback(fieldObj, newValue)
{
    let obj = {
        type:"select2"
    }

    obj.override_opt = {
        dynamic_properties:{
            list_obj:projPath + "/inventory/",
            value_field:'id',
            view_field:'name',
        }
    };

    return obj;
}

tabSignal.connect("openapi.schema.definition.OneTemplate", function(obj) {
    let properties = obj.definition.properties;

    properties.options.hidden = true;
    properties.options_list.hidden = true;
    properties.data.hidden = true;
    properties.data.required = false;

    properties.inventory = {
        name: 'inventory',
        title: 'Inventory',
        required: true,
        type: 'number',
        format: 'dynamic',
        parent_field: 'kind',
        dynamic_properties: {
            __func__callback: 'OneTemplate_inventory_callback',
        }
    }
    properties.group = {
        name: 'group',
        title: 'Group',
        type: 'string',
        format: 'dynamic',
        default: 'all',
        parent_field: 'kind',
        dynamic_properties: {
            __func__callback: 'OneTemplate_group_callback',
        }
    }
    properties.module = {
        name: 'module',
        title: 'Module',
        type: 'string',
        format: 'dynamic',
        parent_field: 'kind',
        dynamic_properties: {
            __func__callback: 'OneTemplate_module_callback',
        }
    }

    properties.args = {
        name: 'args',
        title: 'Arguments',
        type: 'string',
        format: 'dynamic',
        parent_field: 'kind',
        dynamic_properties: {
            __func__callback: 'OneTemplate_args_callback',
        }
    }

    properties.playbook = {
        name: 'playbook',
        title: 'Playbook',
        type: 'string',
        format: 'dynamic',
        parent_field: 'kind',
        dynamic_properties: {
            __func__callback: 'OneTemplate_playbook_callback',
        }
    }

});


tabSignal.connect("openapi.schema",  function(obj)
{
    let template = obj.schema.path['/project/{pk}/template/{template_id}/']
    template.links['options'] = obj.schema.path['/project/{pk}/template/{template_id}/option/'];
    template.links['variables'] = obj.schema.path['/project/{pk}/template/{template_id}/variables/'];
});

function TemplateVariable_key_onInit(opt = {}, value, parent_object)
{
    let thisObj = this;
    let template = new guiObjectFactory("/project/{pk}/template/{template_id}/");

    $.when(template.load(parent_object.url_vars.api_periodic_task_id)).done(function(){
        let fields = {}
        if(template.model.data.kind.toLowerCase() == "task")
        {
            fields = window.guiSchema.path["/project/{pk}/execute_playbook/"].schema.exec.fields
            delete fields.playbook
        }
        if(template.model.data.kind.toLowerCase() == "module")
        {
            fields = window.guiSchema.path["/project/{pk}/execute_module/"].schema.exec.fields
            delete fields.module
        }

        delete fields.inventory
        thisObj.setType("enum", {
            enum:Object.keys(fields),
        });
        thisObj.opt.all_fields = fields

        thisObj._callAllonChangeCallback()
    })
}

function TemplateVariable_value_callback(fieldObj, newValue)
{
    if(!newValue.value)
    {
        return;
    }

    if(!newValue.opt.all_fields)
    {
        return;
    }

    if(!newValue.opt.all_fields[newValue.value])
    {
        return;
    }

    let field = newValue.opt.all_fields[newValue.value]

    field.format = getFieldType(field)

    return field
}

guiElements.template_data = function(opt = {})
{
    this.name = 'template_data'
    guiElements.base.apply(this, arguments)
}

guiElements.template_options = function(opt = {})
{
    this.name = 'template_data'
    guiElements.base.apply(this, arguments)
}
