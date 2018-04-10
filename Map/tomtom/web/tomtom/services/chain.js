
    "use strict";
    function checkIsFunction(fun) {
        if (typeof fun !== "function") {
            throw new TypeError("a function is expected, but " + fun + " [" + (typeof fun) + "] given");
        }
        return fun;
    }

    function isUndefined(value) {
        return value === undefined;
    }

    function isFunction(converter) {
        return typeof converter === "function";
    }

    function chain(data, name, value, validator, converter) {
        if (isUndefined(value)) {
            return isUndefined(data[name]) ? null : data[name];
        }
        if (isFunction(converter)) {
            value = converter.call(this, value);
        }
        if (isFunction(validator)) {
            value = validator.call(this, value);
        }
        data[name] = value;
        return this;
    }

    function checkRequired(fields, data) {
        for (var field in fields) {
            if (fields.hasOwnProperty(field)) {
                var fieldName = fields[field].name || field;
                if (fields[field].required === true && !data.hasOwnProperty(fieldName)) {
                    throw new Error("Missing required " + field);
                }
            }
        }
    }

    function createFunction(f, fields, data) {
        return function (value) {
            var fieldName = fields[f].name || f;
            return chain.call(this, data, fieldName, value, fields[f].validator, fields[f].converter);
        };
    }

    return function (fields, goFunction, options) {
        var data = {},
            that = this;

        fields.callback = {
            validator: checkIsFunction
        };
        fields.fail = {
            validator: checkIsFunction,
            defaultValue: function (e) {
                console.error(e || "Unknown Error");
                throw new Error(e || "Unknown Error");
            }
        };

        var service = {
            go: function (success, fail) {
                if (success) {
                    data.callback = checkIsFunction(success);
                }
                if (fail) {
                    data.fail = checkIsFunction(fail);
                }
                checkRequired(fields, data);
                if (data.callback) {
                    var callback = data.callback;
                    delete data.callback;
                    goFunction.call(that, utils.clone(data), callback);
                } else {
                    return new Promise(function (resolve, reject) {
                        data.fail = function (error) {
                            reject(error);
                        };
                        goFunction.call(that, utils.clone(data), function (response) {
                            resolve(response);
                        });
                    });
                }
            }
        };

        for (var field in fields) {
            if (fields.hasOwnProperty(field)) {
                service[field] = createFunction(field, fields, data);
                if (!isUndefined(fields[field].defaultValue)) {
                    service[field].call(this, fields[field].defaultValue);
                }
                // if options were passed initialize the data
                if (options && options.hasOwnProperty(field)) {
                    service[field].call(this, options[field]);
                }

                if (fields[field].visible === false) {
                    delete service[field];
                }
            }
        }
        if (options && options.fail) {
            data.fail = options.fail;
        }
        return service;
    };

