var ruleMatcher,
    rulesService,
    rules;

rulesService = RulesServiceFactory.getRulesService();
rules = rulesService.get();

ruleMatcher = new RuleMatcher(rules);

chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        return ruleMatcher.redirectOnMatch(details);
    },
    {
        urls : ["<all_urls>"]
    },
    ["blocking"]
);

chrome.webRequest.onCompleted.addListener(
    function(details) {
        var gp_host = '';
        var gp_ports = [];
        for (var i = 0; i < details.responseHeaders.length; ++i) {
            if (details.responseHeaders[i].name === 'x-gp-hostname') {
              gp_host = details.responseHeaders[i].value;
            }
            if (details.responseHeaders[i].name === 'x-gp-port') {
              gp_ports.push(details.responseHeaders[i].value);
            }
        }

        gp_ports.forEach(function(item, index){
            var lport = item.split(',')[0]
            var rport = item.split(',')[1]
            var local_url_for_port = `http://localhost:${lport}`
            var remote_url_for_port = `https://${rport}-${gp_host}`
            var found_rule = false;
            for (var i=0; i<rules.length; ++i){
                var rule = rules[i];
                if (rule.from === local_url_for_port){
                    found_rule = true
                    rule.to = remote_url_for_port;
                    rule.isActive = true;
                }
            }
            if (! found_rule){
                rules.push(
                    {
                        from: local_url_for_port,
                        to: remote_url_for_port,
                        isActive: true
                    });
            }
        });
        rulesService.set(rules);
        return;
    },
    {
        urls : ["https://*.gitpod.io/*"]
    },
    ["responseHeaders"]
);