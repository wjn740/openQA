function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime()+(exdays*24*60*60*1000));
    var expires = "expires="+d.toGMTString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i].trim();
        if (c.indexOf(name)==0) return c.substring(name.length,c.length);
    }
    return false;
}

function setupForAll() {
    $('[data-toggle="tooltip"]').tooltip({html: true});
    $('[data-toggle="popover"]').popover({html: true});
    // workaround for popover with hover on text for firefox
    $('[data-toggle="popover"]').on('click', function (e) {
        e.target.closest('a').focus();
    });

    //$('[data-submenu]').submenupicker();

    $.ajaxSetup({
        headers:
        { 'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') }
    });
}

function addFlash(status, text, container) {
    // add flash messages by default on top of the page
    if (!container) {
        container = $('#flash-messages');
    }

    var div = $('<div class="alert alert-primary alert-dismissible fade show" role="alert"></div>');
    if (typeof text === 'string') {
        div.append($('<span>' + text + '</span>'));
    } else {
        div.append(text);
    }
    div.append($('<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>'));
    div.addClass('alert-' + status);
    container.append(div);
    return div;
}

function addUniqueFlash(status, id, text, container) {
    // add hash to store present flash messages
    if (!window.uniqueFlashMessages) {
        window.uniqueFlashMessages = {};
    }
    // update existing flash message
    var existingFlashMessage = window.uniqueFlashMessages[id];
    if (existingFlashMessage) {
        existingFlashMessage.find('span').first().text(text);
        return;
    }

    var msgElement = addFlash(status, text, container);
    window.uniqueFlashMessages[id] = msgElement;
    msgElement.on('closed.bs.alert', function () {
        delete window.uniqueFlashMessages[id];
    });
}

function toggleChildGroups(link) {
    var buildRow = $(link).parents('.build-row');
    buildRow.toggleClass('children-collapsed');
    buildRow.toggleClass('children-expanded');
    return false;
}

function parseQueryParams() {
    var params = {};
    $.each(window.location.search.substr(1).split('&'), function(index, param) {
        var equationSignIndex = param.indexOf('=');
        var key, value;
        if (equationSignIndex < 0) {
            key = decodeURIComponent(param);
            value = undefined;
        } else {
            key = decodeURIComponent(param.substr(0, equationSignIndex));
            value = decodeURIComponent(param.substr(equationSignIndex + 1));
        }
        if (Array.isArray(params[key])) {
            params[key].push(value);
        } else {
            params[key] = [value];
        }
    });
    return params;
}

function updateQueryParams(params) {
    if (!history.replaceState) {
        return; // skip if not supported
    }
    var search = [];
    $.each(params, function(key, values) {
        $.each(values, function(index, value) {
            if (value === undefined) {
                search.push(encodeURIComponent(key));
            } else {
                search.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
            }
        });
    });
    history.replaceState({} , document.title, window.location.pathname + '?' + search.join('&'));
}

function renderDataSize(sizeInByte) {
    var unitFactor = 1073741824; // one GiB
    var sizeWithUnit = 0;
    $.each([' GiB', ' MiB', ' KiB', ' byte'], function(index, unit) {
        if (!unitFactor || sizeInByte >= unitFactor) {
            sizeWithUnit = (Math.round(sizeInByte / unitFactor * 100) / 100) + unit;
            return false;
        }
        unitFactor >>= 10;
    });
    return sizeWithUnit;
}

function alignBuildLabels() {
  var values = $.map($('.build-label'), function(el, index) { return parseInt($(el).css('width')); });
  var max = Math.max.apply(null, values);
  $('.build-label').css('min-width', max + 'px');
}

// reloads the page - this wrapper exists to be able to disable the reload during tests
function reloadPage() {
    location.reload();
}

// returns an absolute "ws://" URL for the specified URL which might be relative
function makeWsUrlAbsolute(url, servicePortDelta) {
    // don't adjust URLs which are already absolute
    if (url.indexOf('ws:') === 0) {
        return url;
    }

    // read port from the page's current URL
    var location = window.location;
    var port = Number.parseInt(location.port);
    if (Number.isNaN(port)) {
        // don't put a port in the URL if there's no explicit port
        port = '';
    } else {
        if (port !== 80 || port !== 443) {
            // if not using default ports we assume we're not accessing the web UI via Apache/NGINX
            // reverse proxy
            // -> so if not specified otherwise, we're further assuming a connection to the livehandler
            //    daemon which is supposed to run under the <web UI port> + 2
            port += servicePortDelta ? servicePortDelta : 2;
        }
        port = ':' + port;
    }

    return (location.protocol == 'https:' ? 'wss://' : 'ws:/') +
        location.hostname + port +
        (url.indexOf('/') !== 0 ? '/' : '') +
        url;
}

function renderList(items)
{
    var ul = document.createElement('ul');
    items.forEach(function(item) {
        var li = document.createElement('li');
        li.appendChild(document.createTextNode(item));
        li.style.whiteSpace = 'pre-wrap';
        ul.appendChild(li);
    });
    return  ul;
}

function showJobRestartResults(responseJSON, newJobUrl, retryFunction, targetElement) {
    var hasResponse = typeof responseJSON === 'object';
    var errors = hasResponse ? responseJSON.errors : ['Server returned invalid response'];
    var warnings = hasResponse ? responseJSON.warnings : undefined;
    var hasErrors = Array.isArray(errors) && errors.length > 0;
    var hasWarnings = Array.isArray(warnings) && warnings.length > 0;
    if (!hasErrors && !hasWarnings) {
        return false;
    }
    var container = document.createElement('div');
    if (hasResponse && responseJSON.enforceable && retryFunction) {
        var button = document.createElement('button');
        button.onclick = retryFunction;
        button.className = 'btn btn-danger force-restart';
        button.style.float = 'right';
        button.appendChild(document.createTextNode('Force restart'));
        container.appendChild(button);
    }
    if (hasWarnings) {
        container.appendChild(document.createTextNode('Warnings occurred when restarting jobs:'));
        container.appendChild(renderList(warnings));
    }
    if (hasErrors) {
        container.appendChild(document.createTextNode('Errors occurred when restarting jobs:'));
        container.appendChild(renderList(errors));
    }
    if (newJobUrl !== undefined) {
        var link = document.createElement('a');
        link.href = newJobUrl;
        link.appendChild(document.createTextNode('new job'));
        container.appendChild(document.createTextNode('Go to '));
        container.appendChild(link);
        container.appendChild(document.createTextNode('.'));
    }
    addFlash(hasErrors ? 'danger' : 'warning', container, targetElement);
    return true;
}

function forceJobRestartViaRestartLink(restartLink) {
    restartLink.href += '?force=1';
    restartLink.click();
}

function restartJob(ajaxUrl, jobId) {
    var showError = function(reason) {
        var errorMessage = '<strong>Unable to restart job';
        if (reason) {
            errorMessage += ':</strong> ' + reason;
        } else {
            errorMessage += '.</strong>';
        }
        addFlash('danger', errorMessage);
    };

    return $.ajax({
        type: 'POST',
        url: ajaxUrl,
        success: function(data, res, xhr) {
            var responseJSON = xhr.responseJSON;
            var newJobUrl;
            try {
                newJobUrl = responseJSON.test_url[0][jobId];
            }
            catch {}
            if (showJobRestartResults(responseJSON, newJobUrl, restartJob.bind(undefined, ajaxUrl + '?force=1', jobId))) {
                return;
            }
            if (newJobUrl) {
                window.location.replace(newJobUrl);
            } else {
                showError('URL for new job not available');
            }
        },
        error: function(xhr, ajaxOptions, thrownError) {
            showError(xhr.responseJSON ? xhr.responseJSON.error : undefined);
        },
    });
}

function htmlEscape(str) {
    if (str === undefined || str === null) {
        return '';
    }
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
