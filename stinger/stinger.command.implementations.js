﻿angular.module('ng-terminal-example.command.implementations', ['ng-terminal-example.command.tools'])

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
        };
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
        };
        return me;
    };
    commandBrokerProvider.appendCommandHandler(feedbackCommandHandler());





    //==============================================================================//
    // STINGER hacking commands //
    //==============================================================================//


    //==============================================================================//
    // STINGER <List> Command //
    //==============================================================================//

    commandBrokerProvider.appendCommandHandler({
        command: 'stinger-ls',
        description: ['Diplays list of infected computer systems.'],
        handle: function (session) {
            session.output.push({ output: true, text: ['morpho-2\t << INFO: Stacy Holden, Morpho Medical VP Assistant (Office) >>\n\n'], breakLine: false });
            session.output.push({ output: true, text: ['morpho-1\t << INFO: Greg Fields, Morpho Medical SysAdmin (Office) >>'], breakLine: false });
            session.output.push({ output: true, text: ['aconite-1\t << INFO: Oran Plaskett, Aconite Capital CFO (Home) >>'], breakLine: false });
            session.output.push({ output: true, text: ['\n>>STINGER INFECTED SYSTEMS<<'], breakLine: true });
        }
    });


    //==============================================================================//
    // STINGER <Directory> Command //
    //==============================================================================//

    var stingerDirectoryCommandHandler = function () {
        var me = {};
        me.command = 'stinger-cd';
        me.description = ['Changes directory to access an infected computer system.', 
                            "Example: stinger-cd company-1 or stinger-cd company-1 DirectoryName",
                            "See a list of infected systems by typing 'stinger-ls'"];
        me.handle = function (session, param1, param2) {
            var param = [param1, param2].join(" ");
            var outText = [];
            if (!param1) {
                outText.push("You need to provide a directory name, type 'help stinger-cd' to get a hint.");
            }
            else if (param1 === "aconite-1" && !param2) {
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
                        "reminders.txt"
                    ].join("\n"));
            }
            else if (param2 === "Movies") {
                outText.push([
                        "\n>>STINGER DIRECTORY ACCESS GRANTED<<\n",
                        "<"+ param + " Directory>\n",
                        "funny_cat_compilation.mp4",
                        "EPIC_FAILS.mp4",
                        "Spectre 2015 1080p BluRay x264 DTS-JYK.mkv",
                        "Chris McKnett – The Investment Logic for Sustainability.mp4"
                    ].join("\n"));
            }
            else if (param2 === "Music") {
                outText.push([
                        "\n>>STINGER DIRECTORY ACCESS GRANTED<<\n",
                        "<"+ param + " Directory>\n",
                        "The Man Who Sold the World - Midge Ure.mp3",
                        "Train in Vain - The Clash.mp3"
                    ].join("\n"));
            }
            else if (param2 === "Applications") {
                outText.push([
                        "\n>>STINGER DIRECTORY ACCESS GRANTED<<\n",
                        "<"+ param + " Directory>\n",
                        "Chrome Apps.localized",
                        "Chrome Canary Apps.localized"
                    ].join("\n"));
            }
            else if (param2 === "Desktop"
                || param === "aconite-1 Downloads" 
                || param === "aconite-1 Pictures") {
                outText.push([
                        "\n>>STINGER DIRECTORY ACCESS GRANTED<<\n",
                        "<"+ param + " Directory>\n",
                        "Directory is empty.\n"
                    ].join("\n"))
            }
            else if (param2 === "Documents") {
                outText.push([
                        "\n>>STINGER DIRECTORY ACCESS GRANTED<<\n",
                        "<"+ param + " Directory>\n",
                        "Alone_Edgar_Allen_Poe.pdf",
                        "comcast_nov2015.pdf"
                    ].join("\n"));
            }
            else if (param1 === "morpho-1" || param1 === "morpho-2") {
                outText.push("\n>>STINGER DIRECTORY ACCESS DENIED<<\n");
                outText.push("\nYour current mission access level does not grant permission to this infected system!");
            }
            else {
                outText.push([
                    "\nCould not access directory on <" + param1 + ">. Check it exists or that you have permission.",
                    "Type 'help stinger-cd' to get a hint."
                ].join("\n"));
            }
            session.output.push({ output: true, text: outText, breakLine: true });
        };
        return me;
    };
    commandBrokerProvider.appendCommandHandler(stingerDirectoryCommandHandler());


    //==============================================================================//
    // STINGER <Read> Command //
    //==============================================================================//

    var stingerReadCommandHandler = function () {
        var me = {};
        me.command = 'stinger-rd';
        me.description = ['Reads a file within an infected computer system.', 
                            "Example: stinger-rd company-1 document.txt",
                            "See a list of infected systems by typing 'stinger-ls'"];
        me.handle = function (session, param1, param2) {
            var param = [param1, param2].join(" ");
            var outText = [];
            if (!param1) {
                outText.push("You need to provide a file name, type 'help stinger-rd' to get a hint.");
            }
            else if (param1 !== "aconite-1") {
                outText.push([
                    "\nCould not access <" + param1 + ">, the infected system does not exist or you are not authorized.",
                    "Type 'help stinger-rd' to get a hint."
                ].join("\n"));
            }
            else if (param2 === "comcast_nov2015.pdf") {
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
            else if (param2 === "Alone-Edgar_Allen_Poe.pdf") {
                outText.push([
                        "\nSTINGER READ ACCESS <" + param + ">\n",
                        "From childhood's hour I have not been",
                        "As others were -- I have not seen",
                        "As others saw -- I could not bring",
                        "My passions from a common spring --",
                        "From the same source I have not taken",
                        "My sorrow -- I could not awaken",
                        "My heart to joy at the same tone --",
                        "And all I lov'd -- I lov'd alone --",
                        "Then -- in my childhood -- in the dawn",
                        "Of a most stormy life -- was drawn",
                        "From ev'ry depth of good and ill",
                        "The mystery which binds me still --",
                        "From the torrent, or the fountain --",
                        "From the red cliff of the mountain --",
                        "From the sun that 'round me roll'd",
                        "In its autumn tint of gold --",
                        "From the lightning in the sky",
                        "As it pass'd me flying by --",
                        "From the thunder, and the storm --",
                        "And the cloud that took the form",
                        "(When the rest of Heaven was blue)",
                        "Of a demon in my view --"
                    ].join("\n"));
            }
            else if (param2 === "reminders.txt") {
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
                    "\nFile could not be opened on <" + param1 + ">. Filename is incorrect or you may not be authorized.",
                    "Type 'help stinger-rd' to get a hint."
                ].join("\n"));
            }
            session.output.push({ output: true, text: outText, breakLine: true });
        };
        return me;
    };
    commandBrokerProvider.appendCommandHandler(stingerReadCommandHandler());


    //==============================================================================//
    // STINGER <Exploit/Malware> Command //
    //==============================================================================//

    var stingerExploitCommandHandler = function () {
        var correct_virus = "correct_virus";
        var correct_exploit_desc = "remote - Safari User-Assisted Applescript Exec Attack\t\t\t\tcorrect_id";
        var correct_exploit_id = "correct_id";
        var correct_target = "aconite-secure";

        var me = {};
        me.command = 'stinger-exmal';
        me.description = ['Exploit and malware manager toolset, for use in cyberwarfare and cyberintel operations.',
            "Example: stinger-exmal ExploitID MalwareID TargetID",
            "See a list of malware available by typing 'stinger-exmal mals'",
            "See a list of exploits available by typing 'stinger-exmal exls'"];
        me.handle = function (session, param1, param2, param3) {
            var outText = [];
            if (!param1) {
                outText.push([
                    "\nYou need to provide an exploit, malware and target name. ",
                    "Type 'help stinger-exmal' to get a hint."
                ].join("\n"));
            }
            else if (param1 === "mals") {
                outText.push([
                    "\nSTINGER Malware List",
                    "========================",
                    "virus_1",
                    "virus_2",
                    "virus_3",
                    correct_virus
                ].join("\n"));
            }
            else if (param1 === "exls") {
                outText.push([
                    "\nSTINGER Exploit List",
                    "========================",
                    "TITLE\t\t\t\t\t\t\t\t\t\tID",
                    "dos - MacOS X 10.11 FTS Deep Structure of the File System Buffer Overflow\tstn38535",
                    "local - Mac OS X 10.9.5 / 10.10.5 - rsh/libmalloc Privilege Escalation\t\tstn38371",
                    "local - Dropbox < 3.3.x - OSX FinderLoadBundle Local Root Exploit\t\tstn32234",
                    "dos - OS X Regex Engine (TRE) - Stack Buffer Overflow\t\t\t\tstn36487",
                    "shellcode - OS X x64 - tcp bind shellcode, NULL byte free (144 bytes)\t\tstn32874",
                    "local - OS X Install.framework suid Helper Privilege Escalation\t\t\tstn35543",
                    "local - OS X Install.framework Arbitrary mkdir, unlink and chown to admin Group\tstn31298",
                    "local - OS X Install.framework suid root Runner Binary Privilege Escalation\tstn30046",
                    "local - Disconnect.me Mac OS X Client <= 2.0 - Local Privilege Escalation\tstn30765",
                    "shellcode - OS X x64 /bin/sh Shellcode, NULL Byte Free, 34 bytes\t\tstn31774",
                    "local - Apple OS X Entitlements Rootpipe Privilege Escalation\t\t\tstn30922",
                    "local - OS X 10.10.5 - XNU Local Privilege Escalation\t\t\t\tstn31165",
                    correct_exploit_desc,
                    "dos - OSX Keychain - EXC_BAD_ACCESS DoS\t\t\t\t\t\tstn35776",
                    "local - OS X 10.10 - DYLD_PRINT_TO_FILE Local Privilege Escalation\t\tstn33384",
                    "dos - Safari 8.0.X / OS X Yosemite 10.10.3 - Crash Proof Of Concept\t\tstn34421",
                    "remote - MacKeeper URL Handler Remote Code Execution\t\t\t\tstn36643",
                    "dos - Mac OS X - Local Denial of Service\t\t\t\t\tstn37234",
                    "local - Apple MAC OS X < 10.9/10 - Local Root Exploit\t\t\t\tstn38324",
                    "local - Mac OS X - 'Rootpipe' Privilege Escalation\t\t\t\tstn35284"
                ].join("\n"));
            }
            else if (param1 === correct_exploit_id && param2 === correct_virus && param3 === correct_target) {
                outText.push([
                    "\nSTINGER Exploit Malware Manager is currently the following package:",
                    "<< " + param1 + " with malware " + param2 + " against target " + param3 + " >>",
                    "\nEXECUTING.........",
                    "....................",
                    "...................!",
                    "\n" + param3 + " has been successfully infected!",
                    ">>Your success code is: RAR278<<"
                ].join("\n"));
            }
            else if (param1 !== correct_exploit_id) {
                outText.push([
                    "\nSTINGER Exploit Malware Manager is currently the following package:",
                    "<< " + param1 + " with malware " + param2 + " against target " + param3 + " >>",
                    "\nEXECUTING.........",
                    "....................",
                    "...................!",
                    "\nTarget <" + param3 + "> was not infected!",
                    "The exploit <" + param1 + "> failed.",
                    "Check that the exploit is correct for the target."
                ].join("\n"));
            }
            else if (param2 !== correct_virus) {
                outText.push([
                    "\nSTINGER Exploit Malware Manager is currently the following package:",
                    "<< " + param1 + " with malware " + param2 + " against target " + param3 + " >>",
                    "\nEXECUTING.........",
                    "....................",
                    "...................!",
                    "\nTarget <" + param3 + "> was not infected!",
                    "The virus <" + param2 + "> failed.",
                    "Check that the virus is correct for the target."
                ].join("\n"));
            }
            else if (param3 !== correct_target) {
                outText.push([
                    "\nSTINGER Exploit Malware Manager is currently the following package:",
                    "<< " + param1 + " with malware " + param2 + " against target " + param3 + " >>",
                    "\nEXECUTING.........",
                    "....................",
                    "...................!",
                    "\nTarget <" + param3 + "> was not infected!",
                    "Could not access target <" + param3 + ">",
                    "The target may not be authorized for STINGER attack or it may be misspelled."
                ].join("\n"));
            }
            else {
                outText.push([
                    "\nCould not run exploit/malware against target, check that the parameters are correct.",
                    "Type 'help stinger-exmal' to get a hint."
                ].join("\n"));
            }
            session.output.push({ output: true, text: outText, breakLine: true });
        };
        return me;
    };
    commandBrokerProvider.appendCommandHandler(stingerExploitCommandHandler());


    //===============================================================================================//
    //======= END ====================================================================================//
    //===============================================================================================//





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