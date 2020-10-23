var client = new XMLHttpRequest();
client.open('GET', 'js/jq1.js', false);
client.onload = function () {
    var jq1 = client.responseText;
    client.open('GET', 'js/jq2.js', false);
    client.onload = function () {
        var jq2 = client.responseText;
        client.open('GET', 'js/jq3.js', false);
        client.onload = function () {
            var jq3 = client.responseText;
            client.open('GET', 'js/jq4.js', false);
            client.onload = function () {
                var jq4 = client.responseText;
                client.open('GET', 'js/jq5.js', false);
                client.onload = function () {
                    var jq5 = client.responseText;
                    client.open('GET', 'js/jq6.js', false);
                    client.onload = function () {
                        var jq6 = client.responseText;
                        client.open('GET', 'js/jq7.js', false);
                        client.onload = function () {
                            var jq7 = client.responseText;
                            client.open('GET', 'js/jq8.js', false);
                            client.onload = function () {
                                var jq8 = client.responseText;
                                client.open('GET', 'js/jq9.js', false);
                                client.onload = function () {
                                    var jq9 = client.responseText;
                                    client.open('GET', 'js/jq10.js', false);
                                    client.onload = function () {
                                        var jq10 = client.responseText;
                                        client.open('GET', 'js/jq11.js', false);
                                        client.onload = function () {
                                            var jq11 = client.responseText;
                                            client.open('GET', 'js/jq12.js', false);
                                            client.onload = function () {
                                                var jq12 = client.responseText;
                                                var scriptTag = document.createElement("script");
                                                scriptTag.type = "text/javascript";
                                                scriptTag.innerHTML = jq1 + jq2 + jq3 + jq4 + jq5 + jq6 + jq7 + jq8 + jq9 + jq10 + jq11 + jq12;
                                                scriptTag.async = false;
                                                (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(scriptTag);
                                            }
                                            client.send();
                                        }
                                        client.send();
                                    }
                                    client.send();
                                }
                                client.send();
                            }
                            client.send();
                        }
                        client.send();
                    }
                    client.send();
                }
                client.send();
            }
            client.send();
        }
        client.send();
    }
    client.send();
}
client.send();
client.open('GET', 'js/S7_framework.min.js', false);
    client.onload = function () {
    var S7f = client.responseText;
    var scriptTag2 = document.createElement("script");
    scriptTag2.type = "text/javascript";
    scriptTag2.innerHTML = S7f;
    scriptTag2.async = false;
    (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(scriptTag2);
}
client.send();
client.open('GET', 'js/S7_dataUpdate2.js', false);
    client.onload = function () {
    var S7u = client.responseText;
    var scriptTag3 = document.createElement("script");
    scriptTag3.type = "text/javascript";
    scriptTag3.innerHTML = S7u;
    scriptTag3.async = false;
    (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(scriptTag3);
}
client.send();