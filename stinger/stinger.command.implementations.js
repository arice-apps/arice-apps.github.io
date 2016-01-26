angular.module('ng-terminal-example.command.implementations', ['ng-terminal-example.command.tools'])

.config(['commandBrokerProvider', function (commandBrokerProvider) {


    commandBrokerProvider.appendCommandHandler({
        command: 'version',
        description: ['Shows this software version.'],
        handle: function (session) {
            session.output.push({ output: true, text: ['STINGER Version 2.5.3 RELEASE'], breakLine: true });
        }
    });

    commandBrokerProvider.appendCommandHandler({
        command: 'clear',
        description: ['Clears the screen.'],
        handle: function (session) {
            session.commands.push({ command: 'clear' });
        }
    });

    commandBrokerProvider.appendCommandHandler({
        command: 'echo',
        description: ['Echoes input.'],
        handle: function (session) {
            var a = Array.prototype.slice.call(arguments, 1);
            session.output.push({ output: true, text: [a.join(' ')], breakLine: true });
        }
    });

    commandBrokerProvider.appendCommandHandler({
        command: 'eval',
        description: ['Evaluates input as javascript.','Example: eval alert(1)'],
        handle: function (session, param) {
            var a = Array.prototype.slice.call(arguments, 1);
            var param = eval(a.join(' '));
            param = param ? param.toString() : '';
            session.output.push({ output: true, text: [param], breakLine: true });
        }
    });

    commandBrokerProvider.appendCommandHandler({
        command: 'break',
        description: ['Tests how commands are broken down in segments.',"Example: break 'aaa aaa' aaa aaa"],
        handle: function (session) {
            var a = Array.prototype.slice.call(arguments, 1);
            session.output.push({ output: true, text: a, breakLine: true });
        }
    });

    commandBrokerProvider.appendCommandHandler({
        command: 'websocket',
        description: ['Starts a websocket session.',
                      'Syntax: websocket <url> [protocol]',
                      'Example: websocket wss://echo.websocket.org'],
        handle: function (session, url, protocol) {
            if (!url) {
                throw new Error("The parameter 'url' is required, type 'help websocket' to get help.")
            }

            session.output.push({
                output: true,
                text: ["Openning connection to " + url + (protocol ? " with protocol " + protocol : "") + " ...",
                       "Type 'exit' to exit."],
                breakLine: true
            });
            session.commands.push({ command: 'change-prompt', prompt: { path: 'websocket[' + url+']'} });
            session.contextName = "websocket";
            session.context = function () {
                var me = {};
                var ws = protocol ? new WebSocket(url, protocol) : new WebSocket(url);
                ws.onopen = function () {
                    session.output.push({ output: true, text: ["Connection established."], breakLine: true });
                    session.$scope.$apply();
                };

                ws.onerror = function () {
                    session.output.push({ output: true, text: ["Connection error."], breakLine: true });
                    session.$scope.$apply();
                    me.execute(session, "exit");
                };

                ws.onmessage = function (msg) {
                    session.output.push({ output: true, text: [msg.data], breakLine: true });
                    session.$scope.$apply();
                };

                me.execute = function (s, c) {
                    if (c == 'exit') {
                        ws.close();
                        s.contextName = "";
                        delete s.context;
                        s.commands.push({ command: 'reset-prompt', prompt: {path:true} });
                        s.output.push({ output: true, text: ["Websocket ended."], breakLine: true });
                        return;
                    }
                    ws.send(c);
                };
                return me;
            }();
        }
    });

    var suCommandHandler = function () {
        var me = {};
        var ga = null;
        me.command= 'su';
        me.description = ['Changes the  user identity.', "Syntax: su <userName>", "Example: su mgrisha"];
        me.init = ['$ga', function ($ga) {
            ga = $ga;
        }];
        me.handle= function (session, login) {
            if (!login) {
                session.output.push({ output: true, text: ["The <userName> parameter is required.", "Type 'help su' to get a hint."], breakLine: true });
                return;
            }

            ga('set', { userId: login.toString() });
            session.login = login;
            session.commands.push({ command: 'change-prompt', prompt: { user: login }});
            session.output.push({ output: true, text: ["Identity changed."], breakLine: true });
        }
        return me;
    };
    commandBrokerProvider.appendCommandHandler(suCommandHandler());

    var feedbackCommandHandler = function () {
        var me = {};
        var _ga = null;
        me.command = 'feedback';
        me.description = ['Sends a feedback message to the author.', "Example: feedback This application is awesome!"];
        me.init = ['$ga', function ($ga) {
            _ga = $ga;
        }];
        me.handle = function (session, param) {
            param = Array.prototype.slice.call(arguments, 1);
            param = param.join(' ');
            var outText = [];
            if (!param) {
                outText.push("You need to provide a message, type 'help feedback' to get a hint.");
            }
            else {
                outText.push("Your message have been sent.");
                outText.push("Thanks for the feedback!.");
                _ga('send', 'event', 'Console', 'Feedback', param);
            }
            session.output.push({ output: true, text: outText, breakLine: true });
        }
        return me;
    };
    commandBrokerProvider.appendCommandHandler(feedbackCommandHandler());

    // STINGER hacking commands //
    //==========================//

    commandBrokerProvider.appendCommandHandler({
        command: 'stinger-ls',
        description: ['Diplays list of infected computer systems.'],
        handle: function (session) {
            session.output.push({ output: true, text: ['morpho-2 <INFO: Stacy Holden, Morpho Medical VP Assistant>'], breakLine: true });
            session.output.push({ output: true, text: ['morpho-1 <INFO: Greg Fields, Morpho Medical SysAdmin>'], breakLine: false });
            session.output.push({ output: true, text: ['aconite-1 <INFO: Oran Plaskett, Aconite Capital CFO>'], breakLine: false });
        }
    });

    var stingerDirectoryCommandHandler = function () {
        var me = {};
        me.command = 'stinger-cd';
        me.description = ['Changes directory to access an infected computer system.', 
                            "Example: stinger-cd company-1 or stinger-cd company-1 DirectoryName",
                            "See a list of infected systems by typing 'stinger-ls'"];
        me.handle = function (session, param) {
            param = Array.prototype.slice.call(arguments, 1);
            param = param.join(' ');
            var outText = [];
            if (!param) {
                outText.push("You need to provide a directory name, type 'help stinger-cd' to get a hint.");
            }
            else if (param === "aconite-1") {
                outText.push([
                    "\n>>STINGER DIRECTORY ACCESS GRANTED<<\n",
                    "<aconite-1 Main Directory>\n", 
                    "Applications",
                    "Desktop",
                    "Documents",
                    "Downloads",
                    "Movies",
                    "Music",
                    "Pictures",
                    "reminders.txt"].join("\n"));
            }
            else if (param === "aconite-1 Movies") {
                outText.push([
                    "\n>>STINGER DIRECTORY ACCESS GRANTED<<\n",
                    "<"+ param + " Directory>\n", 
                    "funny_cat_compilation.mp4",
                    "EPIC_FAILS.mp4",
                    "Spectre 2015 1080p BluRay x264 DTS-JYK.mkv",
                    "Chris McKnett – The Investment Logic for Sustainability.mp4"
                    ].join("\n"));
            }
            else if (param === "aconite-1 Music") {
                outText.push([
                    "\n>>STINGER DIRECTORY ACCESS GRANTED<<\n",
                    "<"+ param + " Directory>\n", 
                    "The Man Who Sold the World - Midge Ure.mp3",
                    "She's Lost Control - Joy Division.mp3"
                    ].join("\n"));
            }
            else if (param === "aconite-1 Applications") {
                outText.push([
                    "\n>>STINGER DIRECTORY ACCESS GRANTED<<\n",
                    "<"+ param + " Directory>\n", 
                    "Chrome Apps.localized",
                    "Chrome Canary Apps.localized"
                    ].join("\n"));
            }
            else if (param === "aconite-1 Desktop" 
                || param === "aconite-1 Downloads" 
                || param === "aconite-1 Pictures") {
                outText.push([
                    "\n>>STINGER DIRECTORY ACCESS GRANTED<<\n",
                    "<"+ param + " Directory>\n",
                    "Directory is empty.\n"
                    ].join("\n"))
            }
            else if (param === "aconite-1 Documents") {
                outText.push([
                    "\n>>STINGER DIRECTORY ACCESS GRANTED<<\n",
                    "<"+ param + " Directory>\n", 
                    "fiscalQ12014.doc",
                    "fiscalQ42012.doc",
                    "comcast_nov2015.pdf"
                    ].join("\n"));
            }
            else if (param === "morpho-1" || param === "morpho-2") {
                outText.push("\n>>STINGER DIRECTORY ACCESS DENIED<<\n");
                outText.push("\nYour current mission access level does not grant permission to this infected system!");
            }
            else {
                outText.push([
                    "\nCould not access directory. Check it exists or that you have permission to access.",
                    "Type 'help stinger-cd' to get a hint."
                ].join("\n"));
            }
            session.output.push({ output: true, text: outText, breakLine: true });
        }
        return me;
    };
    commandBrokerProvider.appendCommandHandler(stingerDirectoryCommandHandler());

    var stingerReadCommandHandler = function () {
        var me = {};
        me.command = 'stinger-rd';
        me.description = ['Reads a file within an infected computer system.', 
                            "Example: stinger-rd company-1 document.txt",
                            "See a list of infected systems by typing 'stinger-ls'"];
        me.handle = function (session, param) {
            param = Array.prototype.slice.call(arguments, 1);
            param = param.join(' ');
            var outText = [];
            if (!param) {
                outText.push("You need to provide a file name, type 'help stinger-rd' to get a hint.");
            }
            else if (param === "aconite-1 comcast_nov2015.pdf") {
                outText.push([
                    "\nSTINGER READ ACCESS <" + param + ">\n",
                    "ACCOUNT INFORMATION\n",
                    "Account number",
                    "================================================",
                    "344547642",
                    "\nService address",
                    "================================================",
                    "3250 Broadway Street",
                    "San Francisco, CA 94115",
                    "\nBILLING SUMMARY\n",
                    "Previous bill",
                    "================================================",
                    "Previous balance\t\t\t$76.92",
                    "\nCurrent Bill (11/01 - 11/30)",
                    "================================================",
                    "Service (recurring charges)\t\t$77.93",
                    "One-time fees, PPV, Usage\t\t$0.00",
                    "Taxes, surcharges, fees\t\t\t$5.29",
                    "Total bill\t\t\t\t$83.22"
                    ].join("\n"));
            }
            else if (param === "aconite-1 reminders.txt") {
                outText.push([
                    "\nSTINGER READ ACCESS <" + param + ">\n",
                    "Reminders!",
                    "+Take the dog for a walk",
                    "+Buy more paper towels",
                    "+Find a better golf course to take Haruki to"
                    ].join("\n"));
            }
            else {
                outText.push([
                    "\nFile could not be opened. Check the filename is correct or that you have permission.",
                    "Type 'help stinger-rd' to get a hint."
                ].join("\n"));
            }
            session.output.push({ output: true, text: outText, breakLine: true });
        }
        return me;
    };
    commandBrokerProvider.appendCommandHandler(stingerReadCommandHandler());

    var stingerExploitCommandHandler = function () {
        var me = {};
        me.command = 'stinger-exmal';
        me.description = ['Exploit and malware manager toolset, for use in cyberwarfare and cyberintel operations.',
            "Example: stinger-exmal ExploitName MalwareName TargetID",
            "See a list of malware available by typing 'stinger-exmal mals'",
            "See a list of exploits available by typing 'stinger-exmal exls'"];
        me.handle = function (session, param1, param2, param3) {
            var param = [param1, param2, param3].join(" ");
            var outText = [];
            if (!param) {
                outText.push("You need to provide an exploit, malware and target name, type 'help stinger-exmal' to get a hint.");
            }
            else if (param1 === "mals") {
                outText.push([
                    "\nMalware List",
                    "============",
                    "Virus 1",
                    "Virus 2",
                    "Virus 3",
                    "CorrectVirus"
                ].join("\n"));
            }
            else if (param1 === "exls") {
                outText.push([
                    "\nExploit List",
                    "============",
                    "Exploit 1",
                    "Exploit 2",
                    "CorrectExploit"
                ].join("\n"));
            }
            else if (param1 === "CorrectExploit" && param2 === "CorrectVirus" && param3 === "aconite-secure") {
                outText.push([
                    "\nSTINGER Exploit Malware Manager is currently the following package:",
                    "<< " + param1 + " with malware " + param2 + " against target " + param3 + " >>",
                    "\nEXECUTING.........",
                    "....................",
                    "...................!",
                    "\n" + param3 + " has been successfully infected!",
                    ">>Your success code is: DAV443<<"
                ].join("\n"));
            }
            else {
                outText.push([
                    "\nCould not run exploit/malware against target, check that the parameters are correct.",
                    "Type 'help stinger-exmal' to get a hint."
                ].join("\n"));
            }
            session.output.push({ output: true, text: outText, breakLine: true });
        }
        return me;
    };
    commandBrokerProvider.appendCommandHandler(stingerExploitCommandHandler());


    //======= END ============//

    // this must be the last
    var helpCommandHandler = function () {
        var me = {};
        
        me.command = 'help';
        me.description = ['Provides instructions about how to use this terminal'];
        me.handle = function (session, cmd) {
            var list = commandBrokerProvider.describe();
            var outText = [];
            if (cmd) {
                for (var i = 0; i < list.length; i++) {
                    if (list[i].command == cmd) {
                        var l = list[i];
                        outText.push("Command help for: " + cmd);
                        for (var j = 0; j < l.description.length; j++) {
                            outText.push(l.description[j]);
                        }
                        break;
                    }
                }
                if(!outText.length)
                    outText.push("There is no command help for: " + cmd);
            }
            else {
                outText.push("Available commands:");
                for (var i = 0; i < list.length; i++) {
                    var str = "  " + list[i].command + "\n";

                    outText.push(str);
                }
                outText.push("");
                outText.push("Enter 'help <command>' to get help for a particular command.");
            }
            session.output.push({ output: true, text: outText, breakLine: true });
        };
        return me;
    };
    commandBrokerProvider.appendCommandHandler(helpCommandHandler());
}]);