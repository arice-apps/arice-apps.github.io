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
                outText.push("Thanks for the feedback!");
                _ga('send', 'event', 'Console', 'Feedback', param);
            }
            session.output.push({ output: true, text: outText, breakLine: true });
        };
        return me;
    };
    commandBrokerProvider.appendCommandHandler(feedbackCommandHandler());





    //==============================================================================//
    // /////////// STINGER hacking commands ///////////
    //==============================================================================//

    //==============================================================================//
    // STINGER helper functions //
    //==============================================================================//

    var makeLower = function(param) {
        try {
            param = param.toLowerCase();
            return param;
        } catch(e) {
            param = "undefined";
            return param;
        }
    };


    //==============================================================================//
    // STINGER <List> Command //
    //==============================================================================//

    commandBrokerProvider.appendCommandHandler({
        command: 'stinger-ls',
        description: ['Diplays list of infected computer systems.'],
        handle: function (session) {
            var infected_list = [
                '\n>>STINGER INFECTED SYSTEMS<<\n\n',
                'aconite-1\t << INFO: Oran Plaskett, Aconite Capital CFO (Home) >>',
                'morpho-1\t << INFO: Greg Fields, Morpho Medical SysAdmin (Office) >>',
                'morpho-2\t << INFO: Stacy Holden, Morpho Medical VP Assistant (Office) >>',
                'lorenz-1\t << INFO: Olivier Mothé, Lorenz Chaos Theory Specialist (Office) >>',
                'lorenz-2\t << INFO: Seb Reiniger, Lorenz Tropical Storm Expert (Office) >>',
                'lorenz-3\t << INFO: Sven Daecher, Lorenz Ocean Science Expert (Office) >>'
            ];
            session.output.push({ output: true, text: infected_list, breakLine: true });
        }
    });


    //==============================================================================//
    // STINGER <Directory> Command //
    //==============================================================================//

    var stingerDirectoryCommandHandler = function () {
        // Directory contents lists
        var aconite_dir_list = [
            "Applications",
            "Desktop",
            "Documents",
            "Downloads",
            "Movies",
            "Music",
            "Pictures",
            "reminders.txt"
        ];
        var movies_list = "Chris McKnett – The Investment Logic for Sustainability.mp4,EPIC_FAILS.mp4,funny_cat_compilation.mp4,Spectre 2015 1080p BluRay x264 DTS-JYK.mkv,Fury.mov,Mission: Impossible - Rogue Nation.mov,Ex Machina.avi,Mad Max - Fury Road.mov,Interstellar_hd1920x1080(2014).mp4,The_Imitation_Game.mov,The Wolf of Wall Street[2013].mov,The Hunger Games-hd.mov,Her.avi,The Hobbit: The Battle of the Five Armies.mov,Boyhood[2014].avi,American Sniper.mov,Dawn of the Planet of the Apes.mov,Lucy_1920x1080HD.mp4,Transcendence.avi,Wild.mov,Whiplash_HD.mov,The Grand Budapest Hotel.mov"
            .split(",");
        var music_list = "Train in Vain - The Clash.mp3,The Man Who Sold the World - Midge Ure.mp3,David Bowie - Space Oddity.mp3,Louis Armstrong - What a Wonderful World.mp3,Elton John - Your Song(Remix).mp3,Dexys Midnight Runners - Come on Eileen(1982).mp3,U2 - I Still Haven’t Found What I’m Looking For.mp3,Nirvana - Smells Like Teen Spirit.mp3,Neil Diamond - I Am. I Said(1971).mp3,The Beatles - Help!.mp3,Queen - Somebody to Love.mp3,Hozier - Take Me To Church(remix).mp3,Snow Patrol - Run.mp3,Jerry and the Pacemakers - You’ll Never Walk Alone.mp3,John Lennon - Jealous Guy.mp3,Richard Harris - MacArthur Park.mp3,Norah Jones - Cold Cold Heart.mp3,The Monkees - I’m a Believer(1966).mp3,The Eagles - Hotel California.mp3,Coldplay - The Scientist.mp3,Johnny Cash - The Mercy Seat.mp3,Prince - When Doves Cry.mp3"
            .split(",");
        var pictures_list = "IMG_0501.JPG,IMG_2988.JPG,CUTEpuppy_1302.JPG,IMG_0725.JPG,IMG_1238.JPG,IMG_2308.JPG,Japan_Nature_WallpaperHD_0307.JPG,IMG_0602.JPG,Invitation.JPG,IMG_2019.JPG,IMG_0411.JPG,IMG_0496.JPG,IMG_1089.JPG,IMG_0402.JPG,IMG_1752.JPG,HJd82971_0582.gif,IMG_0339.JPG,IMG_1095.JPG,IMG_0056.JPG,sa1vxh00.JPG"
            .split(",");
        var desktop_list = "App Store,iTunes,Investors_List.pages,Contacts,Safari,Pages,IMG_0403.JPG,Invoice.pages,Strategic_Business_Plan_Aconite(In Progress).pages,Tax Receipt 2014.pages,Aconite_Financial_Report.pages,Keynote,Mail,Reminders,IMG_0401.JPG,rts00xVD553.png"
            .split(",");
        var applications_list = "Adobe Reader.app,App Store.app,Automator.app,Calculator.app,Calendar.app,Chess.app,Contacts.app,Dashboard.app,FaceTime.app,iBooks.app,Image Capture.app,iTunes.app,Keynote.app,Launchpad.app,Mail.app,Maps.app,Messages.app,Microsoft Office 2011,Mission Control.app,Notes.app,Pages.app,Photo Booth.app,Preview.app,QuickTime Player.app,Reminders.app,Safari.app,Stickies.app,System Preferences.app,TextEdit.app,Time Machine.app"
            .split(",");
        var documents_list = "Business_Trip_Budget.pages,Resume_2011.pages,Revised_CV_2014.pages,comcast_nov2015.pdf,Tax_Receipt_2011.pages,Tax_Receipt_2012.pages,Tax_receipt_2013.pages,Alone-Edgar_Allen_Poe.pdf"
            .split(",");
        var downloads_list = "18277051_584547341_613671_n.jpg,275-001_20150728-2046_14_6715376.VGA.mp3,5426-97623-1-PB (1).pages,acstn_form (4).pages,advanced-systemcare-setup (1).dmg,advanced-systemcare-setup.dmg,April2015_Statement.pages,Augustine.pages ,Burke.pages,Chromeinstall-8u65.dmg,C49Y23 decoys.pptx,C59A99 decoys.pptx,Dussen.pages,esfs4.14.48-updater.dmg,February2015_Statement.pages,FreeYouTubeDownloaderOC.dmg,Harris.pages,January2015_Statement.pages,July2015_Statement.pages,June2015_Statement.pages,k9_2015_Malkin.docx,March2015_Statement.pages,SetupOfficeTab.dmg"
            .split(",");

        var me = {};
        me.command = 'stinger-cd';
        me.description = ['Changes directory to access an infected computer system.', 
                            "Example: stinger-cd company-1 or stinger-cd company-1 DirectoryName",
                            "See a list of infected systems by typing 'stinger-ls'"];

        me.handle = function (session, param1, param2) {
            param1 = makeLower(param1);
            param2 = makeLower(param2);

            var param = [param1, param2].join(" ");

            // Function to print out initial directory message with access status
            var directory_message = function(dir_name) {
                session.output.push({ output: true, text: [
                    "\n>>STINGER DIRECTORY ACCESS GRANTED<<\n",
                    "<"+ dir_name + " directory>\n"
                ], breakLine: true });
            };

            // Conditional messages returned based on directory name
            if (param1 === "undefined") {
                session.output.push({ output: true, text: ["You need to provide an infected system name, type 'help stinger-cd' to get a hint."], breakLine: true });
            }
            else if (param1 === "aconite-1" && param2 === "undefined") {
                session.output.push({ output: true, text: aconite_dir_list, breakLine: true });
                directory_message(param1 + " Main");
            }
            else if (param1 === "morpho-1" || param1 === "morpho-2" || param1 === "lorenz-1" || param1 === "lorenz-2" || param1 == "lorenz-3") {
                session.output.push({ output: true, text: [
                    "\n>>STINGER DIRECTORY ACCESS DENIED<<\n",
                    "\nYour current mission access level does not grant permission to this infected system!"
                ], breakLine: true });
            }
            else if (param1 === "aconite-1" && param2 === "movies") {
                session.output.push({ output: true, text: movies_list, breakLine: true });
                directory_message(param);
            }
            else if (param1 === "aconite-1" && param2 === "music") {
                session.output.push({ output: true, text: music_list, breakLine: true });
                directory_message(param);
            }
            else if (param1 === "aconite-1" && param2 === "pictures") {
                session.output.push({ output: true, text: pictures_list, breakLine: true });
                directory_message(param);
            }
            else if (param1 === "aconite-1" && param2 === "desktop") {
                session.output.push({ output: true, text: desktop_list, breakLine: true });
                directory_message(param);
            }
            else if (param1 === "aconite-1" && param2 === "applications") {
                session.output.push({ output: true, text: applications_list, breakLine: true });
                directory_message(param);
            }
            else if (param1 === "aconite-1" && param2 === "documents") {
                session.output.push({ output: true, text: documents_list, breakLine: true });
                directory_message(param);
            }
            else if (param1 === "aconite-1" && param2 === "downloads") {
                session.output.push({ output: true, text: downloads_list, breakLine: true });
                directory_message(param);
            }
            else {
                session.output.push({ output: true, text: [
                    "Could not access directory on <" + param1 + ">. Check it exists or that you have permission.",
                    "Type 'help stinger-cd' to get a hint."
                ], breakLine: true });
            }
        };
        return me;
    };
    commandBrokerProvider.appendCommandHandler(stingerDirectoryCommandHandler());


    //==============================================================================//
    // STINGER <Read> Command //
    //==============================================================================//

    var stingerReadCommandHandler = function () {
        var account_number = (66734*5163).toString();

        // Files with read access and contents
        var comcast_file = [
            "\nACCOUNT INFORMATION\n",
            "Account number",
            "================================================",
            account_number,
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
            "Taxes, surcharges, fees\t\t$5.29",
            "Total bill\t\t\t\t$83.22"
        ];
        var poe_file = [
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
        ];
        var reminders_file = [
            "Reminders!",
            "+Take the dog for a walk",
            "+Buy more paper towels",
            "+Find a better golf course to take Haruki to"
        ];

        var me = {};
        me.command = 'stinger-rd';
        me.description = ['Reads a file within an infected computer system.',
                            "Example: stinger-rd company-1 document.txt",
                            "Example: stinger-rd company-1 document.pdf",
                            "See a list of infected systems by typing 'stinger-ls'"];

        me.handle = function (session, param1, param2) {
            param1 = makeLower(param1);
            param2 = makeLower(param2);

            var param = [param1, param2].join(" ");

            // Function to print out file name location and access status
            var read_message = function(dirfile_name) {
                session.output.push({ output: true, text: [
                    "\nSTINGER READ ACCESS <" + dirfile_name + ">\n"
                ], breakLine: true });
            };

            // Conditional messages returned based on filename given
            if (param1 === "undefined") {
                session.output.push({ output: true, text: [
                    "You need to provide an infected system name, type 'help stinger-rd' to get a hint."
                ], breakLine: true });
            }
            else if (param1 !== "aconite-1") {
                session.output.push({ output: true, text: [
                    "Could not access <" + param1 + ">",
                    "The infected system does not exist or you are not authorized.",
                    "Type 'help stinger-rd' to get a hint."
                ], breakLine: true });
            }
            else if (param2 === "comcast_nov2015.pdf") {
                session.output.push({ output: true, text: comcast_file, breakLine: true });
                read_message(param);
            }
            else if (param2 === "alone-edgar_allen_poe.pdf") {
                session.output.push({ output: true, text: poe_file, breakLine: true });
                read_message(param);
            }
            else if (param2 === "reminders.txt") {
                session.output.push({ output: true, text: reminders_file, breakLine: true });
                read_message(param);
            }
            else {
                session.output.push({ output: true, text: [
                    "File could not be opened on <" + param1 + ">",
                    "File name is incorrect or could not read file type.",
                    "Type 'help stinger-rd' to get a hint."
                ], breakLine: true });
            }
        };
        return me;
    };
    commandBrokerProvider.appendCommandHandler(stingerReadCommandHandler());


    //==============================================================================//
    // STINGER <Exploit/Malware> Command //
    //==============================================================================//

    var stingerExploitCommandHandler = function () {
        // Correct flags for exploit id and target
        var correct_exploit_id = "stg" + (256*143).toString();
        var correct_target = "clover-tar1";

        // Exploit and malware list to display when hitting list commands
        var exploit_list = [
            "dos - MacOS X 10.11 FTS Deep Structure of the File System Buffer Overflow\tstg38535",
            "local - Mac OS X 10.9.5 / 10.10.5 - rsh/libmalloc Privilege Escalation\tstg38371",
            "local - Dropbox < 3.3.x - OSX FinderLoadBundle Local Root Exploit\t\tstg32234",
            "dos - OS X Regex Engine (TRE) - Stack Buffer Overflow\t\t\t\tstg36487",
            "shellcode - OS X x64 - tcp bind shellcode, NULL byte free (144 bytes)\t\tstg32874",
            "local - OS X Install.framework suid Helper Privilege Escalation\t\tstg35543",
            "local - OS X Install.framework suid root Runner Binary Privilege Escalation\tstg30046",
            "local - Disconnect.me Mac OS X Client <= 2.0 - Local Privilege Escalation\tstg30765",
            "shellcode - OS X x64 /bin/sh Shellcode, NULL Byte Free, 34 bytes\t\tstg31774",
            "local - Apple OS X Entitlements Rootpipe Privilege Escalation\t\t\tstg30922",
            "local - OS X 10.10.5 - XNU Local Privilege Escalation\t\t\t\tstg31165",
            "remote - Safari User-Assisted Applescript Exec Attack\t\t\t\t" + correct_exploit_id,
            "dos - OSX Keychain - EXC_BAD_ACCESS DoS\t\t\t\t\tstg35776",
            "local - OS X 10.10 - DYLD_PRINT_TO_FILE Local Privilege Escalation\t\tstg33384",
            "dos - Safari 8.0.X / OS X Yosemite 10.10.3 - Crash Proof Of Concept\t\tstg34421",
            "remote - MacKeeper URL Handler Remote Code Execution\t\t\t\tstg36643",
            "dos - Mac OS X - Local Denial of Service\t\t\t\t\tstg37234",
            "local - Apple MAC OS X < 10.9/10 - Local Root Exploit\t\t\t\tstg38324",
            "local - Mac OS X - 'Rootpipe' Privilege Escalation\t\t\t\tstg35284"
        ];
        var malware_list = [
            "OSX.RSPlug.A",
            "OSX.HellRTS",
            "OSX.Backloader",
            "OSX.Crisis",
            "OSX.Flashback",
            "OSX.Inqtana.A",
            "OSX.Macontrol",
            "OSX.Janicab",
            "OSX.Stealbit.A",
            "OSX.Tsunami",
            "OSX.Ransomcrypt",
            "OSX.Pintsized",
            "OSX.Slordu",
            "OSX.Imauler",
            "OSX.Hormesu",
            "OSX.Kitmos",
            "OSX.Luaddit",
            "OSX.Laoshu",
            "OSX.Wirelurker",
            "OSX.Ventir",
            "OSX.Loosemaque",
            "OSX.Olyx.C",
            "OSX.Netweird",
            "OSX.Lamzev.A",
            "OSX.RSPlug.A",
            "OSX.Sudoprint",
            "OSX.SMSSend"
        ];

        var me = {};
        me.command = 'stinger-exmal';
        me.description = ['Exploit and malware manager toolset, for use in cyber warfare and cyber intel operations.',
            "Example: stinger-exmal ExploitID MalwareID TargetID",
            "See a list of malware available by typing 'stinger-exmal mals'",
            "See a list of exploits available by typing 'stinger-exmal exls'"];

        me.handle = function (session, param1, param2, param3) {
            param1 = makeLower(param1);
            param2 = makeLower(param2);
            param3 = makeLower(param3);

            // Output message functions
            var exploit_message = function() {
                session.output.push({ output: true, text: [
                    "\nSTINGER Exploit Malware Manager is currently running the following package:\n\n",
                    "<< " + param1 + " with malware " + param2 + " against target " + param3 + " >>",
                    "\nEXECUTING...........",
                    "..................",
                    ".................!"
                ], breakLine: false});
            };

            // Conditional return messages based on id combos
            if (param1 === "undefined") {
                session.output.push({ output: true, text: [
                    "You need to provide an exploit, malware and target ID. ",
                    "Type 'help stinger-exmal' to get a hint."
                ], breakLine: true });
            }
            else if (param1 === "mals") {
                session.output.push({ output: true, text: malware_list, breakLine: true });
                session.output.push({
                    output: true, text: [
                        "\nSTINGER Malware List",
                        "========================",
                        "MALWARE ID"
                    ], breakLine: false
                });
            }
            else if (param1 === "exls") {
                session.output.push({ output: true, text: exploit_list, breakLine: true });
                session.output.push({
                    output: true, text: [
                        "\nSTINGER Exploit List",
                        "========================",
                        "EXPLOIT TITLE\t\t\t\t\t\t\t\t\tID"
                    ], breakLine: false
                });
            }
            else if (param1 === correct_exploit_id && param2 === "osx.wirelurker" && param3 === correct_target) {
                var success_code = 43*29*46*2;
                session.output.push({ output: true, text: [
                    "\n" + param3 + " has been successfully infected!\n\n",
                    ">>Your success code is: " + success_code + "<<"
                ], breakLine: true });
                exploit_message();
            }
            else if (param1 !== correct_exploit_id) {
                session.output.push({ output: true, text: [
                    "\nTarget <" + param3 + "> was not infected!\n\n",
                    "The exploit <" + param1 + "> failed.",
                    "Check that the exploit is correct for the target."
                ], breakLine: true });
                exploit_message();
            }
            else if (param2 !== "osx.wirelurker") {
                session.output.push({ output: true, text: [
                    "\nTarget <" + param3 + "> was not infected!\n\n",
                    "The virus <" + param2 + "> failed.",
                    "Check that the virus is correct for the target."
                ], breakLine: true });
                exploit_message();
            }
            else if (param3 !== correct_target) {
                session.output.push({ output: true, text: [
                    "\nTarget <" + param3 + "> was not infected!\n\n",
                    "Could not access target <" + param3 + ">",
                    "The target may not be authorized for STINGER attack or it may be misspelled."
                ], breakLine: true });
                exploit_message();
            }
            else {
                session.output.push({ output: true, text: [
                    "Could not run exploit/malware against target, check that the parameters are correct.",
                    "Type 'help stinger-exmal' to get a hint."
                ], breakLine: true });
            }
        };
        return me;
    };
    commandBrokerProvider.appendCommandHandler(stingerExploitCommandHandler());


    //==============================================================================//
    // STINGER <Payload> Command //
    //==============================================================================//

    var stingerPayloadCommandHandler = function () {

        var me = {};
        me.command = 'stinger-pl';
        me.description = ['Launches a NITE Team 4 payload against a target to gain root access.',
            "Example: stinger-pl PayloadID TargetID"];

        var correct_payload = "honey-" + 9*59; //honey-531
        var correct_db = "orchid-db4";

        var vehicle_list = [
            "Tiuna\t\t\t\t3054",
            "Pinzgauer\t\t\t244",
            "Toyota Land Cruiser\t\t1423",
            "M35 Fenix\t\t\t433",
            "M-35/A2 Reo\t\t\t545",
            "Chevrolet Kodiak 7A15\t\t622",
            "MAN 20.280D\t\t\t677",
            "Ural-4320\t\t\t254",
            "Ural-375D\t\t\t623",
            "IVECO/Fiat 90PM16\t\t605",
            "T-72B1V\t\t\t204",
            "AMX-30\t\t\t84",
            "AMX-13C.90\t\t\t36",
            "Scorpion 90 FV-101\t\t78",
            "BMP-3\t\t\t\t163",
            "BTR-80A\t\t\t114",
            "AMX-13 Rafaga\t\t\t25",
            "AMX-13 VTT-VCI\t\t75",
            "Panhard AML S 530\t\t10",
            "Dragoon 3000 LFV2\t\t42",
            "Dragoon AFV\t\t\t59",
            "V-100/V-150 Commando\t\t80",
            "TPz Fuchs\t\t\t10"
        ];

        me.handle = function (session, param1, param2) {
            param1 = makeLower(param1);
            param2 = makeLower(param2);


            // Function to print out file name location and access status
            var payload_message = function() {
                session.output.push({ output: true, text: [
                    "\nSTINGER NITE Team 4 payload is currently launching:\n\n",
                    "<< " + param2 + " receiving payload " + param1 + " >>",
                    "\nEXECUTING...........",
                    "..................",
                    ".................!\n\n"
                ], breakLine: false});
            };

            // Conditional messages returned based on filename given
            if (param1 === "undefined") {
                session.output.push({
                    output: true, text: [
                        "You need to provide a payload name, type 'help stinger-pl' to get a hint."
                    ], breakLine: true
                });
            } else if (param2 === "undefined") {
                session.output.push({
                    output: true, text: [
                        "You need to provide a target name, type 'help stinger-pl' to get a hint."
                    ], breakLine: true
                });
            } else if (param1 !== correct_payload) {
                session.output.push({
                    output: true, text: [
                        "Payload failed against target!",
                        "Ensure you are using the proper payload or that the name is not incorrect.",
                        "Type 'help stinger-pl' to get a hint."
                    ], breakLine: true
                });
                payload_message();
            } else if (param2 !== correct_db) {
                session.output.push({
                    output: true, text: [
                        "Payload failed against target!",
                        "Ensure you are authorized to attack target or that the name is not incorrect.",
                        "Type 'help stinger-pl' to get a hint."
                    ], breakLine: true
                });
                payload_message();
            } else if (param1 === correct_payload && param2 === correct_db) {
                session.output.push({output: true, text: vehicle_list, breakLine: true});
                session.output.push({
                    output: true, text: [
                        "System access obtained! Printing contents of system >>>\n\n",
                        "VENEZUELAN ARMY VEHICLE DATABASE-04\n",
                        "-----------------------------------\n\n",
                        "VEHICLE NAME\t\t\tQUANTITY",
                        "============\t\t\t========"
                    ], breakLine: false
                });
                payload_message();
            }
            else {
                session.output.push({ output: true, text: [
                    "<" + param1 + "> could not be launched against <" + param2 + ">",
                    "Target name is incorrect or you are not authorized.",
                    "Type 'help stinger-pl' to get a hint."
                ], breakLine: true });
            }
        };
        return me;
    };
    commandBrokerProvider.appendCommandHandler(stingerPayloadCommandHandler());


    //==============================================================================//
    // STINGER <Report> Command //
    //==============================================================================//

    var stingerReportCommandHandler = function () {

        var me = {};
        me.command = 'stinger-rp';
        me.description = ['Grants access to NITE Team 4 evidence and report database',
            "Example: stinger-rp DatabaseID (list all entries in report database)",
            "Example: stinger-rp DatabaseID ReportID (read a report from the database)",
            "Example: stinger-rp open ReportID (Opens the Archive and goes to the report)"
        ];

        var m26_db = "combdb-" + 4*7; // combdb-28
        var m26_rp1 = "sigilmalware" + 4*23; // sigilmal92
        var m26_rp1_arch = "NJ" + 7*6 + "KM"; // NJ42KM
        var m26_rp2 = "crypt" + 4*14; // crypt56
        var m26_rp2_arch = "JU" + 5*5 +"ZA"; // JU25ZA


        var m26_db_list = [
            m26_rp1 + "\tReport on the SIGIL malware sample",
            m26_rp2 + "\t\tEncrypted traffic from SIGIL malware sample"
        ];

        me.handle = function (session, param1, param2) {
            param1 = makeLower(param1);
            param2 = makeLower(param2);


            // Function to print out file name location and access status
            var report_message = function(db_name, report_name) {
                session.output.push({ output: true, text: [
                    "\nAccessing NITE Team 4 report <" + report_name + "> from database <" + db_name + ">\n",
                    "\nREADING.............",
                    "..................",
                    ".................!\n\n"
                ], breakLine: false});
            };

            // Conditional messages returned based on filename given
            if (param1 === "undefined") {
                session.output.push({
                    output: true, text: [
                        "You need to provide a report database name, type 'help stinger-rp' to get a hint."
                    ], breakLine: true
                });
            } else if (param1 === m26_db && param2 === "undefined") {
                session.output.push({
                    output: true, text: m26_db_list, breakLine: true
                });
                session.output.push({
                    output: true, text: [
                        "\nNITE Team 4 Report & Evidence Database",
                        "------------------------------------\n\n",
                        "REPORT ID\t\tDESCRIPTION",
                        "=========\t\t==========="
                    ], breakLine: false
                });
            } else if (param1 === "open" && param2 === m26_rp1) {
                window.open("http://archive.blackwatchmen.com/search/" + m26_rp1_arch);
            } else if (param1 === "open" && param2 === m26_rp2) {
                window.open("http://archive.blackwatchmen.com/search/" + m26_rp2_arch);
            } else if (param1 !== m26_db) {
                session.output.push({
                    output: true, text: [
                        "Database <" + param1 + "> could not be accessed!",
                        "Ensure you are authorized for access or that the name is not incorrect.",
                        "Type 'help stinger-rp' to get a hint."
                    ], breakLine: true
                });
            } else if (param1 === m26_db && param2 === m26_rp1) {
                session.output.push({
                    output: true, text: [
                        "Dumping contents of report to >>> Archive Call #" + m26_rp1_arch
                    ], breakLine: true
                });
                report_message(param1, param2);
            } else if (param1 === m26_db && param2 === m26_rp2) {
                session.output.push({
                    output: true, text: [
                        "Dumping contents of report to >>> Archive Call #" + m26_rp2_arch // JU25ZA
                    ], breakLine: true
                });
                report_message(param1, param2);
            } else if (param2 !== m26_rp1 || param2 !== m26_rp2) {
                session.output.push({
                    output: true, text: [
                        "Report could not be read from <" + param1 + ">",
                        "Ensure you are authorized for access or that the name is not incorrect.",
                        "Type 'help stinger-rp' to get a hint."
                    ], breakLine: true
                });
            } else {
                session.output.push({ output: true, text: [
                    "<" + param2 + "> in <" + param1 + "> could not be accessed.",
                    "Name is incorrect or you are not authorized.",
                    "Type 'help stinger-rp' to get a hint."
                ], breakLine: true });
            }
        };
        return me;
    };
    commandBrokerProvider.appendCommandHandler(stingerReportCommandHandler());

    //==============================================================================//
    // STINGER <Camera> Command //
    //==============================================================================//

    var stingerCameraCommandHandler = function () {
        var flag = false;
        var timer_started = false;
        function setFlag(status) {
            flag = status;
        }
        function setTimerStarted(status) {
            timer_started = status;
        }

        var me = {};
        me.command = 'stinger-cm';
        me.description = [
            "Hacks cameras in an infected facility.",
            "\n",
            "Example: stinger-cm status",
            "Example: stinger-cm select [insert camID]",
            "Example: stinger-cm [insert camID] [insert password guess]",
            "Example: stinger-cm abort [insert camID]",
            "Example: stinger-cm admin [insert password guess]",
            "Example: stinger-cm op-complete"
        ];

        var cam_list = {
            "cam32": 0,
            "cam21": 0,
            "cam30": 0,
            "cam55": 0,
            "cam41": 0,
            "cam65": 0,
            "cam19": 0,
            "cam74": 0,
            "cam49": 0
        };
        var selected_cam = null;
        var password_list = [
            "thesun",
            "beyond",
            "themountains",
            "glows",
            "theyellow",
            "riverseawards",
            "flowsyou",
            "canenjoy",
            "grander",
            "sightby",
            "climbingto",
            "greater",
            "height"
        ];
        var master_password = "wangzhihuan";
        var master_correct = false;
        var passid = null;
        var success_code = "VN" + 2*7 + "ZX";      // VN14ZX
        var timer = null;

        var passTimer = function() {
            setTimerStarted(true);
            setFlag(false);
            timer = window.setTimeout(function() {
                setFlag(true);
                setTimerStarted(false);
                if (cam_list[selected_cam] !== 1) {
                    cam_list[selected_cam] = 2;
                }
            }, 64000);
        };

        function setMaster(status) {
            master_correct = status;
        }

        me.handle = function (session, param1, param2) {
            param1 = makeLower(param1);
            param2 = makeLower(param2);

            switch(param1) {
                case "status":
                    // 0 flag means no action has been taken on the camera
                    // 1 flag means that player succeeded in hacking the camera
                    // 2 flag means that player failed in hacking the camera
                    // 3 flag means that the player has begun a session on the camera
                    for (var key in cam_list) {
                        var value = cam_list[key];
                        var status_str = "";
                        if (value === 2) {
                            status_str = "Locked out";
                        } else if (value === 1) {
                            status_str = "Hacked"
                        } else if (value === 3) {
                            status_str = "Online (hacking in progress)"
                        } else {
                            status_str = "Online"
                        }
                        session.output.push({output: true, text: [key + ": " + status_str], breakLine: true});
                    }
                    session.output.push({ output: true, text: [
                        "\n",
                        "List of security cams and status:",
                        "=================================\n"
                    ], breakLine: true });
                    break;
                case selected_cam:
                    // Has the timer run out for the selected camera?
                    if (flag === true) {
                        session.output.push({ output: true, text: [
                            "Time to access this camera has been exceeded!"
                        ], breakLine: true });
                        // If it has, was it previously listed as hacked?
                        if (cam_list[selected_cam] === 1) {
                            session.output.push({
                                output: true, text: [
                                    "This camera has already been hacked!"
                                ], breakLine: false
                            });
                            break;
                        }
                    } else if (cam_list[selected_cam] === 2) {               // The user was locked out
                        session.output.push({ output: true, text: [
                            "You're locked out of this camera!"
                        ], breakLine: true });
                    } else if(param2 === password_list[passid]) {    // The user guessed right
                        session.output.push({ output: true, text: [
                            "Accessing system................ Success!\n",
                            "The camera was hacked!"
                        ], breakLine: true });
                        cam_list[selected_cam] = 1;
                        setFlag(true);
                        setTimerStarted(false);
                    } else if (cam_list[selected_cam] === 1) {
                        session.output.push({ output: true, text: [
                            "The camera has already been hacked!"
                        ], breakLine: true });
                        break;
                    } else if (passid === null || selected_cam === null) {
                        session.output.push({ output: true, text: [
                            "An ANTENNA session for this camera was not started!"
                        ], breakLine: true });
                    } else if (param2 === "abort") {
                        session.output.push({ output: true, text: [
                            "Camera was aborted! You are now locked out of this camera."
                        ], breakLine: true });
                        cam_list[selected_cam] = 2;
                        setFlag(true);
                        setTimerStarted(false);
                    }
                    else {
                        session.output.push({ output: true, text: [
                            "The password was incorrect."
                        ], breakLine: true });
                    }
                    break;
                case "select":
                    if (timer_started === true) {
                        session.output.push({ output: true, text: [
                            "An ANTENNA session is still running for a camera!",
                            "Complete the hack for that camera or wait until timer ends."
                        ], breakLine: true });
                        break;
                    }

                    // Set selected cam to the user supplied camera
                    selected_cam = param2;

                    // Do a check to see if the user has locked up the camera in a previous attempt
                    if (cam_list[selected_cam] === 2) {
                        session.output.push({ output: true, text: [
                            "You're locked out of this camera!"
                        ], breakLine: true });
                        break;
                    } else if (cam_list[selected_cam] === 3) {
                        session.output.push({ output: true, text: [
                            "ANTENNA session for camera has already started!"
                        ], breakLine: true });
                        break;
                    } else if (cam_list[selected_cam] === 1) {
                        session.output.push({ output: true, text: [
                            "This camera has already been hacked!"
                        ], breakLine: true });
                        break;
                    } else if (cam_list[selected_cam] === 0) {
                        window.clearTimeout(timer);
                    } else {
                        session.output.push({ output: true, text: [
                            "This camera does not exist!",
                            "Enter 'stinger-cm status' to see full list of cameras."
                        ], breakLine: true });
                        break;
                    }

                    // Reset the timed out flag
                    setFlag(false);
                    // Remove the selected password if one was picked last round.
                    if (passid !== null) {
                        delete password_list[passid];
                    }
                    // Select a random password for the camera
                    passid = Math.floor((Math.random() * password_list.length) + 1);
                    var cam_password = password_list[passid];
                    if (cam_password === undefined) {
                        while (cam_password === undefined) {
                            passid = Math.floor((Math.random() * password_list.length) + 1);
                            cam_password = password_list[passid];
                        }
                    }
                    var random_letter_num1 = Math.floor((Math.random() * cam_password.length) + 1);
                    var random_letter_num2 = Math.floor((Math.random() * cam_password.length) + 1);
                    var random_letter_1 =  cam_password[random_letter_num1];
                    var random_letter_2 = cam_password[random_letter_num2];
                    if (random_letter_1 === undefined) {
                        while (random_letter_1 === undefined) {
                            random_letter_num1 = Math.floor((Math.random() * cam_password.length) + 1);
                            random_letter_1 = cam_password[random_letter_num1];
                        }
                    } else if (random_letter_2 === undefined) {
                        while (random_letter_2 === undefined) {
                            random_letter_num2 = Math.floor((Math.random() * cam_password.length) + 1);
                            random_letter_2 = cam_password[random_letter_num2];
                        }
                    }
                    else if (random_letter_num1 === random_letter_num2) {
                        while (random_letter_num1 === random_letter_num2) {
                            random_letter_num2 = Math.floor((Math.random() * cam_password.length) + 1);
                            random_letter_2 = cam_password[random_letter_num2];
                        }
                    }
                    var hashed_password = cam_password.replace(random_letter_1, "#").replace(random_letter_2, "#");
                    session.output.push({ output: true, text: [
                        "Entering computer for <" + selected_cam + ">",
                        "Listening to microphone...",
                        "Background noise detected, attempting to catch as many keys as possible...",
                        "Password relogin error thrown...",
                        "Waiting on input...",
                        "...................",
                        "...................",
                        "...................",
                        "...................",
                        "...................",
                        "...................",
                        "...................",
                        "...................",
                        "...................",
                        "...................",
                        "...................",
                        "...................",
                        "...................",
                        "...................",
                        "...................",
                        "...................",
                        "................!!!",
                        "\nA password was entered! ANTENNA caught the following keys:\n",
                        "\n>>>[ " +  hashed_password + " ]<<<\n\n",
                        "You have 1 minute remaining to enter the correct password for <" + selected_cam + ">"
                    ], breakLine: true });
                    passTimer();
                    // We set this camera as having begun a session
                    cam_list[selected_cam] = 3;
                    break;
                case "admin":
                    if (param2 === master_password) {
                        setMaster(true);
                        session.output.push({ output: true, text: [
                            "Security camera system admin access granted!"
                        ], breakLine: true });
                    } else {
                        session.output.push({ output: true, text: [
                            "Password incorrect!",
                            "\n",
                            "Did you forget your password? This is your hint: Chinese"
                        ], breakLine: true });
                    }
                    session.output.push({ output: true, text: [
                        "\n",
                        "Security Camera Admin Login",
                        "==========================="
                    ], breakLine: false });
                    break;
                case "op-complete":
                    var success_cnt = 0;
                    for (var key in cam_list) {
                        if (cam_list[key] === 1) {
                            success_cnt++;
                        }
                    }
                    if (success_cnt >= 5 && master_correct === true) {
                        session.output.push({ output: true, text: [
                            "Operation completed successfully! Success code is " + success_code
                        ], breakLine: true });
                        break;
                    } else {
                        session.output.push({ output: true, text: [
                            success_cnt + "/" + Object.keys(cam_list).length + " cameras were hacked. Admin access and minimum 5/" + Object.keys(cam_list).length + " needed to complete mission."
                        ], breakLine: true });
                        break;
                    }
                default:
                    session.output.push({ output: true, text: [
                        "Command could not execute!"
                    ], breakLine: true });
                    break;
            }
        };
        return me;
    };
    commandBrokerProvider.appendCommandHandler(stingerCameraCommandHandler());


    //==============================================================================//
    // STINGER <Raid> Command //
    //==============================================================================//

    var stingerStrikeCommandHandler = function () {

        var me = {};
        me.command = 'stinger-str';
        me.description = ['Command a strike team through the STINGER interface.',
            "\n",
            "Example: stinger-str list",
            "Example: stinger-str status [insert room_id]",
            "Example: stinger-str set [insert room_id] [insert feature id] [on/off]",
            "Example: stinger-str enter [insert room_id]",
            "Example: stinger-str istealer [insert room_id]",
            "Example: stinger-str exit [insert room_id]",
            "Example: stinger-str log check",
            "Example: stinger-str log [insert decision_id] [y/n]",
            "Example: stinger-str op-complete"
        ];

        var info_points = 0;
        var ongoingRooms = false;
        var ongoingID = "";
        var room_occupants = null;
        var distraction_room_found = false;
        var death_flag = false;
        var success_code = "PL" + 7*13 + "BW";

        function addInfoPoints(info) {
            info_points += info;
            return info_points;
        }

        // Enter room truth variables here
        var room_truth_obj = {
            room_3: {
                "name": "[Lab 3 - Bioweapons]",
                "id": "room_3",
                "door_status": true,
                "motion_status": true,
                "biometric_auth": true,
                "room_occupied": false
            },
            room_2: {
                "name": "[Lab 2 - Rift Creature Containment]",
                "id": "room_2",
                "door_status": true,
                "motion_status": false,
                "biometric_auth": true,
                "room_occupied": true
            },
            room_1: {
                "name": "[Lab 1 - Teleportation Particle Lab]",
                "id": "room_1",
                "door_status": true,
                "motion_status": true,
                "biometric_auth": false,
                "room_occupied": false
            }
        };

        // Enter room variables here
        var room_obj = {
            room_3: {
                "name": "[Lab 3 - Bioweapons]",
                "id": "room_3",
                "door_status": true,
                "motion_status": true,
                "biometric_auth": true,
                "room_occupied": false,
                "downloader": false,
                "raid_ongoing": false,
                "entry_success": false,
                "exit_success": false,
                "room_success": false,
                "points": 2,
                "distraction": false
            },
            room_2: {
                "name": "[Lab 2 - Rift Creature Containment]",
                "id": "room_2",
                "door_status": true,
                "motion_status": false,
                "biometric_auth": true,
                "room_occupied": true,
                "downloader": false,
                "raid_ongoing": false,
                "entry_success": false,
                "exit_success": false,
                "room_success": false,
                "points": 2,
                "distraction": false
            },
            room_1: {
                "name": "[Lab 1 - Teleportation Particle Lab]",
                "id": "room_1",
                "door_status": true,
                "motion_status": true,
                "biometric_auth": false,
                "room_occupied": false,
                "downloader": false,
                "raid_ongoing": false,
                "entry_success": false,
                "exit_success": false,
                "room_success": false,
                "points": 2,
                "distraction": false
            }
        };

        var risk_total = 0;
        var bonus_total = 0;
        var current_risk = 10 + risk_total;

        function increaseRisk(decision) {
            if (current_risk > 1) {
                risk_total += decision.risk;
            }
        }
        function calculateBonus(decision) {
            bonus_total += decision.bonus;
            return bonus_total;
        }

        var decision_obj = {
            decision_1: {
                "name": "Reception Office",
                "message_shown": false,
                "yes_msg": "MSG FROM SQUAD LEADER: We are approaching the desk...",
                "no_msg": "MSG FROM SQUAD LEADER: We're going to head straight past the desk. [+2 points]",
                "conservative": false,
                "win_msg": "MSG FROM SQUAD LEADER: Our persuasion worked and we received details on systems in the facility! [+",
                "fail_msg": "MSG FROM SQUAD LEADER: Receptionist was not convinced, we did not gain any info. [+0 points]",
                "bonus": 3,
                "points": 2,
                "fail": false,
                "win": false,
                "risk": -20
            },
            decision_2: {
                "name": "Mystery Closet",
                "message_shown": false,
                "yes_msg": "MSG FROM SQUAD LEADER: I'm opening the closet...",
                "no_msg": "MSG FROM SQUAD LEADER: Might be too risky to check, we will leave it closed. [+2 points]",
                "conservative": false,
                "win_msg": "MSG FROM SQUAD LEADER: We found some maintenance files on the facility layout! [+",
                "fail_msg": "MSG FROM SQUAD LEADER: There's nothing here... Closet has been cleared. [+0 points]",
                "bonus": 3,
                "points": 2,
                "fail": false,
                "win": false,
                "risk": -20
            },
            decision_3: {
                "name": "Executive Terminal",
                "message_shown": false,
                "yes_msg": "MSG FROM SQUAD LEADER: Trying to login now...",
                "no_msg": "MSG FROM SQUAD LEADER: Roger. Moving onwards... [+2 points]",
                "conservative": false,
                "win_msg": "MSG FROM SQUAD LEADER: We got access! There are some executive files on here. [+",
                "fail_msg": "MSG FROM SQUAD LEADER: Nothing of interest was found. [+0 points]",
                "bonus": 3,
                "points": 2,
                "fail": false,
                "win": false,
                "risk": -20
            }
        };

        var calculateGamble = function (decision) {
            if (decision.fail === false && decision.win === false) {
                increaseRisk(decision);
                var gambleOutcome = Math.floor(Math.random() * 100) + 1;
                if (gambleOutcome >= 1 && gambleOutcome <= (100 + risk_total)) {
                    decision.win = true;
                    decision.points += calculateBonus(decision);
                    addInfoPoints(decision.points);
                    return ["Your risk level is now at: [" + risk_total + "%] and have " + (100 + risk_total) + "% chance of succeeding.\n\n", decision.win_msg + decision.points + " points]"];
                } else {
                    decision.fail = true;
                    return ["Your risk level is now at: [" + risk_total + "%] and have " + (100 + risk_total) + "% chance of succeeding.\n\n", decision.fail_msg];
                }
            } else if (decision.win === true) {
                return ["You already won this decision."];
            } else {
                return ["You failed this decision."];
            }
        };

        function setDoor(obj, status) {
            obj.door_status = status;
            if (status === true) {
                return "\nDoor access control has been turned ON";
            } else {
                return "\nDoor access control has been turned OFF";
            }
        }
        function setMotion(obj, status) {
            obj.motion_status = status;
            if (status === true) {
                return "\nMotion sensors have been turned ON";
            } else {
                return "\nMotion sensors have been turned OFF";
            }
        }
        function setBioauth(obj, status) {
            obj.biometric_auth = status;
            if (status === true) {
                return "\nBiometrics Auth on workstations has been turned ON";
            } else {
                return "\nBiometrics Auth on workstations has been turned OFF";
            }
        }
        function setDistract(obj, status) {
            obj.distraction = status;
            if (status === true) {
                room_occupants = obj.id;
                return "Room alarm has been turned ON. It attracted the attention of nearby employees.";
            } else {
                return "Room alarm has been turned OFF.";
            }
        }

        function setDownload(obj, status) {
            obj.downloader = status;
            if (status === true) {
                return ["\niStealer has been activated... Devices found!\n\n",
                    "Info stealing operations starting, please wait...\n\n",
                    "[0%=====================================",
                    "========================================",
                    "========================================",
                    "========================================",
                    "========================================",
                    "========================================",
                    "========================================",
                    "========================================",
                    "========================================",
                    "========================================",
                    "===================================100%]",
                    "\nDownload complete! " + Math.floor(Math.random() * 1000) + " TB of data stolen! [+2 points]"];
            }
        }
        function setRaid(obj, status) {
            obj.raid_ongoing = status;
        }
        function setEntry(obj, status) {
            obj.entry_success = status;
        }
        function setExit(obj, status) {
            obj.exit_success = status;
        }
        function setRoom(obj, status) {
            obj.room_success = status;
        }

        function checkEntry(obj) {
            // Entry success condition
            if (
                obj.door_status === false &&
                obj.motion_status === false &&
                obj.room_success === false &&
                obj.biometric_auth === false &&
                obj.room_occupied === false &&
                obj.distraction === false &&
                ongoingRooms === false
            ) {
                setEntry(obj, true);
                setRaid(obj, true);
            }
            for (var room in room_obj) {
                if (room_obj[room].raid_ongoing === true) {
                    ongoingID = room_obj[room].id;
                    ongoingRooms = true;
                }
            }
            return obj.entry_success;
        }
        function checkExit(obj) {
            // Exit success condition
            if (
                obj.downloader === true
            ) {
                setExit(obj, true);
                setRaid(obj, false);
                ongoingRooms = false;
                resetDistraction();
            }
            return obj.exit_success;
        }
        function checkDistraction(roomObj) {
            // Check if a room has a distraction, if it does, move the occupants to that room
            for (var room in room_obj) {
                if (room_obj[room].distraction === true) {
                    room_occupants = roomObj.id;
                    roomObj.room_occupied = true;
                    distraction_room_found = true;
                }
            }
            for (var room in room_obj) {
                if (distraction_room_found === true && room_obj[room].room_occupied === true && room_obj[room].id !== roomObj.id) {
                    room_obj[room].room_occupied = false;
                    return "Employees from " + room_obj[room].id + " left their room to investigate."
                }
            }
        }

        function roomClear(obj) {
            // Room success condition
            if (
                obj.entry_success === true &&
                obj.exit_success === true

            ) {
                setRoom(obj, true);
            }
            return obj.room_success;
        }

        function resetDistraction() {
            var room_return = null;
            for (var room in room_obj) {
                room_obj[room].room_occupied = room_truth_obj[room_obj[room].id].room_occupied;
            }
            for (var room in room_obj) {
                if (room_obj[room].room_occupied === true) {
                    room_return = room_obj[room].id;
                }
            }
            room_occupants = null;
            distraction_room_found = false;
        }

        function countWinNum() {
            var room_win_count = 0;
            for (var room in room_obj) {
                if (room_obj[room].room_success === true) {
                    room_win_count++
                }
            }
            return room_win_count;
        }

        var playerDecision = function(decision, choice) {
            var message_returns = [];
            if (decision.fail === false && decision.win === false && decision.conservative === false) {
                if (choice === "y") {
                    message_returns.push(decision.yes_msg);
                    message_returns.push(calculateGamble(decision));
                    message_returns.push("\n***You made a risky decision and now have a total of [" + info_points + " info points]");
                    return message_returns;
                } else if (choice === "n") {
                    decision.conservative = true;
                    message_returns.push(decision.no_msg);
                    message_returns.push("\n***You made a conservative decision and now have a total of [" + addInfoPoints(decision.points) + " points]");
                    return message_returns;
                } else {
                    return ["You did not enter a choice! Choose yes [y] or no [n]"];
                }
            } else {
                return ["You already made this decision!"];
            }
        };

        //Specify params here
        me.handle = function (session, param1, param2, param3, param4) {
            param1 = makeLower(param1);
            param2 = makeLower(param2);
            param3 = makeLower(param3);
            param4 = makeLower(param4);

            function printTotal() {
                session.output.push({
                    output: true,
                    text: [
                        "Your current information score is now: [" + info_points + " points]"
                    ],
                    breakLine: true
                });
            }

            var selected_room = room_obj[param2];

            // Print out status of all rooms
            var room_list_print = function() {
                for (var room in room_obj) {
                    session.output.push({ output: true, text: [
                        "Room name: " + room_obj[room].name,
                        "Room ID: " + room_obj[room].id,
                        "Room cleared? : " + room_obj[room].room_success
                    ], breakLine: true});
                }
                session.output.push({ output: true, text: [
                    "\nAccessing Theta Facility security room status...",
                    "\nREADING.............",
                    "..................",
                    ".................!\n\n"
                ], breakLine: false});
            };

            // Conditional cases and responses
            if (death_flag === false) {
                switch (param1) {
                    case "list":
                        room_list_print();
                        break;
                    case "set":
                        switch(param3) {
                            case "door":
                                if (param4 === "on") {
                                    session.output.push({ output: true, text: [setDoor(selected_room, true)], breakLine: true});
                                }
                                else if (param4 === "off") {
                                    session.output.push({ output: true, text: [setDoor(selected_room, false)], breakLine: true});
                                } else {
                                    session.output.push({ output: true, text: ["An error occurred! Terminal could not interpret command."], breakLine: true});
                                }
                                break;
                            case "motion":
                                if (param4 === "on") {
                                    setMotion(selected_room, true);
                                    if (selected_room.raid_ongoing === true) {
                                        session.output.push({
                                            output: true,
                                            text: ["\nThe motion detectors turned on while your team was in the room.",
                                                "\nThey were killed!"],
                                            breakLine: true
                                        });
                                        death_flag = true;
                                        break;
                                    }
                                    session.output.push({ output: true, text: [setMotion(selected_room, true)], breakLine: true});
                                }
                                else if (param4 === "off") {
                                    session.output.push({ output: true, text: [setMotion(selected_room, false)], breakLine: true});
                                } else {
                                    session.output.push({ output: true, text: ["An error occurred! Terminal could not interpret command."], breakLine: true});
                                }
                                break;
                            case "bioauth":
                                if (param4 === "on") {
                                    session.output.push({ output: true, text: [setBioauth(selected_room, true)], breakLine: true});
                                }
                                else if (param4 === "off") {
                                    session.output.push({ output: true, text: [setBioauth(selected_room, false)], breakLine: true});
                                } else {
                                    session.output.push({ output: true, text: ["An error occurred! Terminal could not interpret command."], breakLine: true});
                                }
                                break;
                            case "distraction":
                                if (param4 === "on") {
                                    var distract_success = true;
                                    if (selected_room.distraction === false && room_occupants === null) {
                                        for (var value in room_truth_obj[selected_room.id]) {
                                            if (selected_room[value] !== room_truth_obj[selected_room.id][value]) {
                                                session.output.push({ output: true, text: ["Oh no! You've been caught! Employees found a misconfigured room."], breakLine: true});
                                                distract_success = false;
                                                death_flag = true;
                                                break;
                                            }
                                        }
                                        if (distract_success === true) {
                                            session.output.push({ output: true, text: ["\n",setDistract(selected_room, true),"\n",checkDistraction(selected_room)], breakLine: true});
                                        }
                                    } else if (selected_room.distraction === true) {
                                        session.output.push({ output: true, text: ["A distraction has already been turned on in this room!"], breakLine: true});
                                    } else if (room_occupants !== null) {
                                        session.output.push({ output: true, text: ["Only one distraction can be on at a time!"], breakLine: true});
                                    }
                                }
                                else if (param4 === "off") {
                                    if (selected_room.distraction === false) {
                                        session.output.push({ output: true, text: ["There is no distraction turned on for this room!"], breakLine: true});
                                        break;
                                    }
                                    session.output.push({ output: true, text: [setDistract(selected_room, false)], breakLine: true});
                                    resetDistraction();
                                } else {
                                    session.output.push({ output: true, text: ["System could not interpret this command."], breakLine: true});
                                }
                                break;
                        }
                        break;
                    case "istealer":
                        try {
                            if (selected_room.entry_success === true && selected_room.downloader === false && selected_room.room_success === false && selected_room.raid_ongoing === true) {
                                addInfoPoints(selected_room.points);
                                printTotal();
                                session.output.push({ output: true, text: setDownload(selected_room, true), breakLine: true});
                            } else if (selected_room.downloader === false && selected_room.room_success === false) {
                                session.output.push({ output: true, text: ["\n","iStealer encountered an error! --> You are not in this room."], breakLine: true});
                            } else if (selected_room.downloader === true) {
                                session.output.push({ output: true, text: ["\n","iStealer encountered an error! --> Data has already been downloaded from this room."], breakLine: true});
                            } else {
                                session.output.push({ output: true, text: ["\n","iStealer encountered an error! --> Verify your inputs."], breakLine: true});
                            }
                        } catch(err) {
                            session.output.push({ output: true, text: ["\n","iStealer encountered an error! --> Verify your inputs."], breakLine: true});
                            break;
                        }
                        break;
                    case "status":
                        if (param2 === "room_1" || param2 === "room_2" || param2 === "room_3") {
                            session.output.push({ output: true, text: [
                                "Room name: " + selected_room.name,
                                "Room ID: " + selected_room.id,
                                "\n",
                                "Access control status [ID: door]: " + selected_room.door_status,
                                "Motion sensor status [ID: motion]: " + selected_room.motion_status,
                                "Biometrics Auth status [ID: bioauth]: " + selected_room.biometric_auth,
                                "Room alarm status [ID: distraction]: " + selected_room.distraction,
                                "Room occupied status: " + selected_room.room_occupied
                            ], breakLine: true});
                            session.output.push({ output: true, text: ["\n"], breakLine: false});
                        }
                        break;
                    case "enter":
                        if (param2 === "room_1" || param2 === "room_2" || param2 === "room_3") {
                            checkEntry(selected_room);
                            if (selected_room.entry_success === true && selected_room.raid_ongoing === true) {
                                session.output.push({
                                    output: true,
                                    text: ["\n",selected_room.name + " entry was a success!"],
                                    breakLine: true
                                });
                                session.output.push({
                                    output: true,
                                    text: ["\n","Entering room..."],
                                    breakLine: false
                                });
                            } else if (ongoingRooms === true) {
                                session.output.push({
                                    output: true,
                                    text: ["\n","Your team is still inside " + ongoingID,
                                        "Exit the room you are in before asking them to enter a new room."],
                                    breakLine: true
                                });
                            } else if (selected_room.room_success === true) {
                                session.output.push({
                                    output: true,
                                    text: ["\n",selected_room.id + " has already been cleared! There's no need to go back."],
                                    breakLine: true
                                });
                            } else if (selected_room.door_status === false && selected_room.room_occupied === true) {
                                session.output.push({ output: true, text: ["\n","You entered a room that was occupied! You were spotted and killed!"], breakLine: true});
                                death_flag = true;
                                break;
                            } else if (selected_room.door_status === false && selected_room.motion_status === true) {
                                session.output.push({ output: true, text: ["\n","You entered a room while the motion detector was on! You were spotted and killed!"], breakLine: true});
                                death_flag = true;
                                break;
                            } else if (selected_room.door_status === false && selected_room.door_status === false && selected_room.biometric_auth === true) {
                                session.output.push({ output: true, text: ["\n","This room has biometrics enabled, you won't be able to get any data unless it is disabled."], breakLine: true});
                            } else if (selected_room.distraction === true) {
                                session.output.push({ output: true, text: ["\n","This room has a distraction that is active, turn it off before entering."], breakLine: true});
                            }
                            else if (selected_room.door_status === true) {
                                session.output.push({ output: true, text: ["\n","The door is locked... You can't get inside unless the authorization is disabled."], breakLine: true});
                            } else {
                                session.output.push({
                                    output: true,
                                    text: [selected_room.name + " entry was a failure!"],
                                    breakLine: true
                                });
                            }
                        } else {
                            session.output.push({ output: true, text: ["System could not interpret this command."], breakLine: true});
                        }
                        break;
                    case "exit":
                        if (param2 === "room_1" || param2 === "room_2" || param2 === "room_3") {
                            if (selected_room.room_success === true) {
                                session.output.push({
                                    output: true,
                                    text: ["\n", "You already left " + selected_room.id],
                                    breakLine: true
                                });
                                break;
                            }
                            checkExit(selected_room);
                            if (selected_room.exit_success === true && selected_room.raid_ongoing === false) {
                                session.output.push({
                                    output: true,
                                    text: ["The strike commander found something! We require your input.", "Check the log [stinger-str log check]."],
                                    breakLine: true
                                });
                                session.output.push({
                                    output: true,
                                    text: [selected_room.name + " exit was a success!"],
                                    breakLine: true
                                });
                                session.output.push({ output: true, text: [
                                    "\nExiting room..."
                                ], breakLine: true});
                                roomClear(selected_room);
                            } else if (selected_room.raid_ongoing === true && selected_room.downloader === false) {
                                session.output.push({
                                    output: true,
                                    text: ["\n", selected_room.name + " exit was a failure!","\nYou need to download the room files using iStealer!"],
                                    breakLine: true
                                });
                            } else if (selected_room.raid_ongoing === false) {
                                session.output.push({
                                    output: true,
                                    text: ["\n", "You are not inside " + selected_room.id + ".", "You can't exit a room you aren't in!"],
                                    breakLine: true
                                });
                            } else {
                                session.output.push({
                                    output: true,
                                    text: ["Could not exit the room, check inputs and status of room then try again."],
                                    breakLine: true
                                });
                            }
                        } else {
                            session.output.push({ output: true, text: ["System could not interpret this command."], breakLine: true});
                        }
                        break;
                    case "log":
                        var selected_decision = null;
                        switch(param2) {
                            case "check":
                                switch(countWinNum()) {
                                    case 1:
                                        session.output.push({ output: true, text: [
                                            "1) Reception: Should we ask for a badge? [log decision_1] [y/n]"
                                        ], breakLine: true});
                                        break;
                                    case 2:
                                        session.output.push({ output: true, text: [
                                            "1) Reception: Should we ask for a badge? [log decision_1] [y/n]",
                                            "2) Mystery closet: Could have intel inside, should we open it? [log decision_2] [y/n]"
                                        ], breakLine: true});
                                        break;
                                    case 3:
                                        session.output.push({ output: true, text: [
                                            "1) Reception: Should we try to persuade the receptionist for info? [log decision_1] [y/n]",
                                            "2) Mystery closet: Could have intel inside, should we open it? [log decision_2] [y/n]",
                                            "3) Executive terminal: Found this terminal, might have sensitive info may be available [log decision_3] [y/n]"
                                        ], breakLine: true});
                                        break;
                                    default:
                                        session.output.push({ output: true, text: ["No events in the log at this time..."], breakLine: true});
                                        break;
                                }
                                break;
                            case "decision_1":
                                if (countWinNum() >= 1) {
                                    selected_decision = decision_obj[param2];
                                    session.output.push({ output: true, text: playerDecision(selected_decision, param3), breakLine: true});
                                } else {
                                    session.output.push({ output: true, text: ["This decision is not available..."], breakLine: true});
                                }
                                break;
                            case "decision_2":
                                if (countWinNum() >= 2) {
                                    selected_decision = decision_obj[param2];
                                    session.output.push({ output: true, text: playerDecision(selected_decision, param3), breakLine: true});
                                } else {
                                    session.output.push({ output: true, text: ["This decision is not available..."], breakLine: true});
                                }
                                break;
                            case "decision_3":
                                if (countWinNum() >= 3) {
                                    selected_decision = decision_obj[param2];
                                    session.output.push({ output: true, text: playerDecision(selected_decision, param3), breakLine: true});
                                } else {
                                    session.output.push({ output: true, text: ["This decision is not available..."], breakLine: true});
                                }
                                break;
                            default:
                                session.output.push({ output: true, text: ["This decision is not available..."], breakLine: true});
                        }
                        break;
                    case "op-complete":
                        if (info_points >= 6 && countWinNum() === 3) {
                            session.output.push({ output: true, text: ["\n","You obtained enough info points and cleared rooms to complete the mission!", "Success code ---> " + success_code], breakLine: true});
                        } else {
                            session.output.push({ output: true, text: ["\n","Your information score is not high enough or all rooms have not been cleared.",
                                "\n","Your current information score is now: [" + info_points + " points]",
                                "Number of cleared rooms is: [" + countWinNum() + " cleared room(s)]"], breakLine: true});
                        }
                        break;
                    default:
                        session.output.push({ output: true, text: ["System could not interpret this command."], breakLine: true});
                }
            } else {
                session.output.push({ output: true, text: ["\n","Your team is dead..."], breakLine: true});
            }

        };
        return me;
    };
    commandBrokerProvider.appendCommandHandler(stingerStrikeCommandHandler());

    //===============================================================================================//
    //======= END OF HACKING TERMINAL COMMANDS CODE =================================================//
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
}]);angular.module('ng-terminal-example.command.implementations', ['ng-terminal-example.command.tools'])

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
                    outText.push("Thanks for the feedback!");
                    _ga('send', 'event', 'Console', 'Feedback', param);
                }
                session.output.push({ output: true, text: outText, breakLine: true });
            };
            return me;
        };
        commandBrokerProvider.appendCommandHandler(feedbackCommandHandler());





        //==============================================================================//
        // /////////// STINGER hacking commands ///////////
        //==============================================================================//

        //==============================================================================//
        // STINGER helper functions //
        //==============================================================================//

        var makeLower = function(param) {
            try {
                param = param.toLowerCase();
                return param;
            } catch(e) {
                param = "undefined";
                return param;
            }
        };


        //==============================================================================//
        // STINGER <List> Command //
        //==============================================================================//

        commandBrokerProvider.appendCommandHandler({
            command: 'stinger-ls',
            description: ['Diplays list of infected computer systems.'],
            handle: function (session) {
                var infected_list = [
                    '\n>>STINGER INFECTED SYSTEMS<<\n\n',
                    'aconite-1\t << INFO: Oran Plaskett, Aconite Capital CFO (Home) >>',
                    'morpho-1\t << INFO: Greg Fields, Morpho Medical SysAdmin (Office) >>',
                    'morpho-2\t << INFO: Stacy Holden, Morpho Medical VP Assistant (Office) >>',
                    'lorenz-1\t << INFO: Olivier Mothé, Lorenz Chaos Theory Specialist (Office) >>',
                    'lorenz-2\t << INFO: Seb Reiniger, Lorenz Tropical Storm Expert (Office) >>',
                    'lorenz-3\t << INFO: Sven Daecher, Lorenz Ocean Science Expert (Office) >>'
                ];
                session.output.push({ output: true, text: infected_list, breakLine: true });
            }
        });


        //==============================================================================//
        // STINGER <Directory> Command //
        //==============================================================================//

        var stingerDirectoryCommandHandler = function () {
            // Directory contents lists
            var aconite_dir_list = [
                "Applications",
                "Desktop",
                "Documents",
                "Downloads",
                "Movies",
                "Music",
                "Pictures",
                "reminders.txt"
            ];
            var movies_list = "Chris McKnett – The Investment Logic for Sustainability.mp4,EPIC_FAILS.mp4,funny_cat_compilation.mp4,Spectre 2015 1080p BluRay x264 DTS-JYK.mkv,Fury.mov,Mission: Impossible - Rogue Nation.mov,Ex Machina.avi,Mad Max - Fury Road.mov,Interstellar_hd1920x1080(2014).mp4,The_Imitation_Game.mov,The Wolf of Wall Street[2013].mov,The Hunger Games-hd.mov,Her.avi,The Hobbit: The Battle of the Five Armies.mov,Boyhood[2014].avi,American Sniper.mov,Dawn of the Planet of the Apes.mov,Lucy_1920x1080HD.mp4,Transcendence.avi,Wild.mov,Whiplash_HD.mov,The Grand Budapest Hotel.mov"
                .split(",");
            var music_list = "Train in Vain - The Clash.mp3,The Man Who Sold the World - Midge Ure.mp3,David Bowie - Space Oddity.mp3,Louis Armstrong - What a Wonderful World.mp3,Elton John - Your Song(Remix).mp3,Dexys Midnight Runners - Come on Eileen(1982).mp3,U2 - I Still Haven’t Found What I’m Looking For.mp3,Nirvana - Smells Like Teen Spirit.mp3,Neil Diamond - I Am. I Said(1971).mp3,The Beatles - Help!.mp3,Queen - Somebody to Love.mp3,Hozier - Take Me To Church(remix).mp3,Snow Patrol - Run.mp3,Jerry and the Pacemakers - You’ll Never Walk Alone.mp3,John Lennon - Jealous Guy.mp3,Richard Harris - MacArthur Park.mp3,Norah Jones - Cold Cold Heart.mp3,The Monkees - I’m a Believer(1966).mp3,The Eagles - Hotel California.mp3,Coldplay - The Scientist.mp3,Johnny Cash - The Mercy Seat.mp3,Prince - When Doves Cry.mp3"
                .split(",");
            var pictures_list = "IMG_0501.JPG,IMG_2988.JPG,CUTEpuppy_1302.JPG,IMG_0725.JPG,IMG_1238.JPG,IMG_2308.JPG,Japan_Nature_WallpaperHD_0307.JPG,IMG_0602.JPG,Invitation.JPG,IMG_2019.JPG,IMG_0411.JPG,IMG_0496.JPG,IMG_1089.JPG,IMG_0402.JPG,IMG_1752.JPG,HJd82971_0582.gif,IMG_0339.JPG,IMG_1095.JPG,IMG_0056.JPG,sa1vxh00.JPG"
                .split(",");
            var desktop_list = "App Store,iTunes,Investors_List.pages,Contacts,Safari,Pages,IMG_0403.JPG,Invoice.pages,Strategic_Business_Plan_Aconite(In Progress).pages,Tax Receipt 2014.pages,Aconite_Financial_Report.pages,Keynote,Mail,Reminders,IMG_0401.JPG,rts00xVD553.png"
                .split(",");
            var applications_list = "Adobe Reader.app,App Store.app,Automator.app,Calculator.app,Calendar.app,Chess.app,Contacts.app,Dashboard.app,FaceTime.app,iBooks.app,Image Capture.app,iTunes.app,Keynote.app,Launchpad.app,Mail.app,Maps.app,Messages.app,Microsoft Office 2011,Mission Control.app,Notes.app,Pages.app,Photo Booth.app,Preview.app,QuickTime Player.app,Reminders.app,Safari.app,Stickies.app,System Preferences.app,TextEdit.app,Time Machine.app"
                .split(",");
            var documents_list = "Business_Trip_Budget.pages,Resume_2011.pages,Revised_CV_2014.pages,comcast_nov2015.pdf,Tax_Receipt_2011.pages,Tax_Receipt_2012.pages,Tax_receipt_2013.pages,Alone-Edgar_Allen_Poe.pdf"
                .split(",");
            var downloads_list = "18277051_584547341_613671_n.jpg,275-001_20150728-2046_14_6715376.VGA.mp3,5426-97623-1-PB (1).pages,acstn_form (4).pages,advanced-systemcare-setup (1).dmg,advanced-systemcare-setup.dmg,April2015_Statement.pages,Augustine.pages ,Burke.pages,Chromeinstall-8u65.dmg,C49Y23 decoys.pptx,C59A99 decoys.pptx,Dussen.pages,esfs4.14.48-updater.dmg,February2015_Statement.pages,FreeYouTubeDownloaderOC.dmg,Harris.pages,January2015_Statement.pages,July2015_Statement.pages,June2015_Statement.pages,k9_2015_Malkin.docx,March2015_Statement.pages,SetupOfficeTab.dmg"
                .split(",");

            var me = {};
            me.command = 'stinger-cd';
            me.description = ['Changes directory to access an infected computer system.',
                "Example: stinger-cd company-1 or stinger-cd company-1 DirectoryName",
                "See a list of infected systems by typing 'stinger-ls'"];

            me.handle = function (session, param1, param2) {
                param1 = makeLower(param1);
                param2 = makeLower(param2);

                var param = [param1, param2].join(" ");

                // Function to print out initial directory message with access status
                var directory_message = function(dir_name) {
                    session.output.push({ output: true, text: [
                        "\n>>STINGER DIRECTORY ACCESS GRANTED<<\n",
                        "<"+ dir_name + " directory>\n"
                    ], breakLine: true });
                };

                // Conditional messages returned based on directory name
                if (param1 === "undefined") {
                    session.output.push({ output: true, text: ["You need to provide an infected system name, type 'help stinger-cd' to get a hint."], breakLine: true });
                }
                else if (param1 === "aconite-1" && param2 === "undefined") {
                    session.output.push({ output: true, text: aconite_dir_list, breakLine: true });
                    directory_message(param1 + " Main");
                }
                else if (param1 === "morpho-1" || param1 === "morpho-2" || param1 === "lorenz-1" || param1 === "lorenz-2" || param1 == "lorenz-3") {
                    session.output.push({ output: true, text: [
                        "\n>>STINGER DIRECTORY ACCESS DENIED<<\n",
                        "\nYour current mission access level does not grant permission to this infected system!"
                    ], breakLine: true });
                }
                else if (param1 === "aconite-1" && param2 === "movies") {
                    session.output.push({ output: true, text: movies_list, breakLine: true });
                    directory_message(param);
                }
                else if (param1 === "aconite-1" && param2 === "music") {
                    session.output.push({ output: true, text: music_list, breakLine: true });
                    directory_message(param);
                }
                else if (param1 === "aconite-1" && param2 === "pictures") {
                    session.output.push({ output: true, text: pictures_list, breakLine: true });
                    directory_message(param);
                }
                else if (param1 === "aconite-1" && param2 === "desktop") {
                    session.output.push({ output: true, text: desktop_list, breakLine: true });
                    directory_message(param);
                }
                else if (param1 === "aconite-1" && param2 === "applications") {
                    session.output.push({ output: true, text: applications_list, breakLine: true });
                    directory_message(param);
                }
                else if (param1 === "aconite-1" && param2 === "documents") {
                    session.output.push({ output: true, text: documents_list, breakLine: true });
                    directory_message(param);
                }
                else if (param1 === "aconite-1" && param2 === "downloads") {
                    session.output.push({ output: true, text: downloads_list, breakLine: true });
                    directory_message(param);
                }
                else {
                    session.output.push({ output: true, text: [
                        "Could not access directory on <" + param1 + ">. Check it exists or that you have permission.",
                        "Type 'help stinger-cd' to get a hint."
                    ], breakLine: true });
                }
            };
            return me;
        };
        commandBrokerProvider.appendCommandHandler(stingerDirectoryCommandHandler());


        //==============================================================================//
        // STINGER <Read> Command //
        //==============================================================================//

        var stingerReadCommandHandler = function () {
            var account_number = (66734*5163).toString();

            // Files with read access and contents
            var comcast_file = [
                "\nACCOUNT INFORMATION\n",
                "Account number",
                "================================================",
                account_number,
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
                "Taxes, surcharges, fees\t\t$5.29",
                "Total bill\t\t\t\t$83.22"
            ];
            var poe_file = [
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
            ];
            var reminders_file = [
                "Reminders!",
                "+Take the dog for a walk",
                "+Buy more paper towels",
                "+Find a better golf course to take Haruki to"
            ];

            var me = {};
            me.command = 'stinger-rd';
            me.description = ['Reads a file within an infected computer system.',
                "Example: stinger-rd company-1 document.txt",
                "Example: stinger-rd company-1 document.pdf",
                "See a list of infected systems by typing 'stinger-ls'"];

            me.handle = function (session, param1, param2) {
                param1 = makeLower(param1);
                param2 = makeLower(param2);

                var param = [param1, param2].join(" ");

                // Function to print out file name location and access status
                var read_message = function(dirfile_name) {
                    session.output.push({ output: true, text: [
                        "\nSTINGER READ ACCESS <" + dirfile_name + ">\n"
                    ], breakLine: true });
                };

                // Conditional messages returned based on filename given
                if (param1 === "undefined") {
                    session.output.push({ output: true, text: [
                        "You need to provide an infected system name, type 'help stinger-rd' to get a hint."
                    ], breakLine: true });
                }
                else if (param1 !== "aconite-1") {
                    session.output.push({ output: true, text: [
                        "Could not access <" + param1 + ">",
                        "The infected system does not exist or you are not authorized.",
                        "Type 'help stinger-rd' to get a hint."
                    ], breakLine: true });
                }
                else if (param2 === "comcast_nov2015.pdf") {
                    session.output.push({ output: true, text: comcast_file, breakLine: true });
                    read_message(param);
                }
                else if (param2 === "alone-edgar_allen_poe.pdf") {
                    session.output.push({ output: true, text: poe_file, breakLine: true });
                    read_message(param);
                }
                else if (param2 === "reminders.txt") {
                    session.output.push({ output: true, text: reminders_file, breakLine: true });
                    read_message(param);
                }
                else {
                    session.output.push({ output: true, text: [
                        "File could not be opened on <" + param1 + ">",
                        "File name is incorrect or could not read file type.",
                        "Type 'help stinger-rd' to get a hint."
                    ], breakLine: true });
                }
            };
            return me;
        };
        commandBrokerProvider.appendCommandHandler(stingerReadCommandHandler());


        //==============================================================================//
        // STINGER <Exploit/Malware> Command //
        //==============================================================================//

        var stingerExploitCommandHandler = function () {
            // Correct flags for exploit id and target
            var correct_exploit_id = "stg" + (256*143).toString();
            var correct_target = "clover-tar1";

            // Exploit and malware list to display when hitting list commands
            var exploit_list = [
                "dos - MacOS X 10.11 FTS Deep Structure of the File System Buffer Overflow\tstg38535",
                "local - Mac OS X 10.9.5 / 10.10.5 - rsh/libmalloc Privilege Escalation\tstg38371",
                "local - Dropbox < 3.3.x - OSX FinderLoadBundle Local Root Exploit\t\tstg32234",
                "dos - OS X Regex Engine (TRE) - Stack Buffer Overflow\t\t\t\tstg36487",
                "shellcode - OS X x64 - tcp bind shellcode, NULL byte free (144 bytes)\t\tstg32874",
                "local - OS X Install.framework suid Helper Privilege Escalation\t\tstg35543",
                "local - OS X Install.framework suid root Runner Binary Privilege Escalation\tstg30046",
                "local - Disconnect.me Mac OS X Client <= 2.0 - Local Privilege Escalation\tstg30765",
                "shellcode - OS X x64 /bin/sh Shellcode, NULL Byte Free, 34 bytes\t\tstg31774",
                "local - Apple OS X Entitlements Rootpipe Privilege Escalation\t\t\tstg30922",
                "local - OS X 10.10.5 - XNU Local Privilege Escalation\t\t\t\tstg31165",
                "remote - Safari User-Assisted Applescript Exec Attack\t\t\t\t" + correct_exploit_id,
                "dos - OSX Keychain - EXC_BAD_ACCESS DoS\t\t\t\t\tstg35776",
                "local - OS X 10.10 - DYLD_PRINT_TO_FILE Local Privilege Escalation\t\tstg33384",
                "dos - Safari 8.0.X / OS X Yosemite 10.10.3 - Crash Proof Of Concept\t\tstg34421",
                "remote - MacKeeper URL Handler Remote Code Execution\t\t\t\tstg36643",
                "dos - Mac OS X - Local Denial of Service\t\t\t\t\tstg37234",
                "local - Apple MAC OS X < 10.9/10 - Local Root Exploit\t\t\t\tstg38324",
                "local - Mac OS X - 'Rootpipe' Privilege Escalation\t\t\t\tstg35284"
            ];
            var malware_list = [
                "OSX.RSPlug.A",
                "OSX.HellRTS",
                "OSX.Backloader",
                "OSX.Crisis",
                "OSX.Flashback",
                "OSX.Inqtana.A",
                "OSX.Macontrol",
                "OSX.Janicab",
                "OSX.Stealbit.A",
                "OSX.Tsunami",
                "OSX.Ransomcrypt",
                "OSX.Pintsized",
                "OSX.Slordu",
                "OSX.Imauler",
                "OSX.Hormesu",
                "OSX.Kitmos",
                "OSX.Luaddit",
                "OSX.Laoshu",
                "OSX.Wirelurker",
                "OSX.Ventir",
                "OSX.Loosemaque",
                "OSX.Olyx.C",
                "OSX.Netweird",
                "OSX.Lamzev.A",
                "OSX.RSPlug.A",
                "OSX.Sudoprint",
                "OSX.SMSSend"
            ];

            var me = {};
            me.command = 'stinger-exmal';
            me.description = ['Exploit and malware manager toolset, for use in cyber warfare and cyber intel operations.',
                "Example: stinger-exmal ExploitID MalwareID TargetID",
                "See a list of malware available by typing 'stinger-exmal mals'",
                "See a list of exploits available by typing 'stinger-exmal exls'"];

            me.handle = function (session, param1, param2, param3) {
                param1 = makeLower(param1);
                param2 = makeLower(param2);
                param3 = makeLower(param3);

                // Output message functions
                var exploit_message = function() {
                    session.output.push({ output: true, text: [
                        "\nSTINGER Exploit Malware Manager is currently running the following package:\n\n",
                        "<< " + param1 + " with malware " + param2 + " against target " + param3 + " >>",
                        "\nEXECUTING...........",
                        "..................",
                        ".................!"
                    ], breakLine: false});
                };

                // Conditional return messages based on id combos
                if (param1 === "undefined") {
                    session.output.push({ output: true, text: [
                        "You need to provide an exploit, malware and target ID. ",
                        "Type 'help stinger-exmal' to get a hint."
                    ], breakLine: true });
                }
                else if (param1 === "mals") {
                    session.output.push({ output: true, text: malware_list, breakLine: true });
                    session.output.push({
                        output: true, text: [
                            "\nSTINGER Malware List",
                            "========================",
                            "MALWARE ID"
                        ], breakLine: false
                    });
                }
                else if (param1 === "exls") {
                    session.output.push({ output: true, text: exploit_list, breakLine: true });
                    session.output.push({
                        output: true, text: [
                            "\nSTINGER Exploit List",
                            "========================",
                            "EXPLOIT TITLE\t\t\t\t\t\t\t\t\tID"
                        ], breakLine: false
                    });
                }
                else if (param1 === correct_exploit_id && param2 === "osx.wirelurker" && param3 === correct_target) {
                    var success_code = 43*29*46*2;
                    session.output.push({ output: true, text: [
                        "\n" + param3 + " has been successfully infected!\n\n",
                        ">>Your success code is: " + success_code + "<<"
                    ], breakLine: true });
                    exploit_message();
                }
                else if (param1 !== correct_exploit_id) {
                    session.output.push({ output: true, text: [
                        "\nTarget <" + param3 + "> was not infected!\n\n",
                        "The exploit <" + param1 + "> failed.",
                        "Check that the exploit is correct for the target."
                    ], breakLine: true });
                    exploit_message();
                }
                else if (param2 !== "osx.wirelurker") {
                    session.output.push({ output: true, text: [
                        "\nTarget <" + param3 + "> was not infected!\n\n",
                        "The virus <" + param2 + "> failed.",
                        "Check that the virus is correct for the target."
                    ], breakLine: true });
                    exploit_message();
                }
                else if (param3 !== correct_target) {
                    session.output.push({ output: true, text: [
                        "\nTarget <" + param3 + "> was not infected!\n\n",
                        "Could not access target <" + param3 + ">",
                        "The target may not be authorized for STINGER attack or it may be misspelled."
                    ], breakLine: true });
                    exploit_message();
                }
                else {
                    session.output.push({ output: true, text: [
                        "Could not run exploit/malware against target, check that the parameters are correct.",
                        "Type 'help stinger-exmal' to get a hint."
                    ], breakLine: true });
                }
            };
            return me;
        };
        commandBrokerProvider.appendCommandHandler(stingerExploitCommandHandler());


        //==============================================================================//
        // STINGER <Payload> Command //
        //==============================================================================//

        var stingerPayloadCommandHandler = function () {

            var me = {};
            me.command = 'stinger-pl';
            me.description = ['Launches a NITE Team 4 payload against a target to gain root access.',
                "Example: stinger-pl PayloadID TargetID"];

            var correct_payload = "honey-" + 9*59; //honey-531
            var correct_db = "orchid-db4";

            var vehicle_list = [
                "Tiuna\t\t\t\t3054",
                "Pinzgauer\t\t\t244",
                "Toyota Land Cruiser\t\t1423",
                "M35 Fenix\t\t\t433",
                "M-35/A2 Reo\t\t\t545",
                "Chevrolet Kodiak 7A15\t\t622",
                "MAN 20.280D\t\t\t677",
                "Ural-4320\t\t\t254",
                "Ural-375D\t\t\t623",
                "IVECO/Fiat 90PM16\t\t605",
                "T-72B1V\t\t\t204",
                "AMX-30\t\t\t84",
                "AMX-13C.90\t\t\t36",
                "Scorpion 90 FV-101\t\t78",
                "BMP-3\t\t\t\t163",
                "BTR-80A\t\t\t114",
                "AMX-13 Rafaga\t\t\t25",
                "AMX-13 VTT-VCI\t\t75",
                "Panhard AML S 530\t\t10",
                "Dragoon 3000 LFV2\t\t42",
                "Dragoon AFV\t\t\t59",
                "V-100/V-150 Commando\t\t80",
                "TPz Fuchs\t\t\t10"
            ];

            me.handle = function (session, param1, param2) {
                param1 = makeLower(param1);
                param2 = makeLower(param2);


                // Function to print out file name location and access status
                var payload_message = function() {
                    session.output.push({ output: true, text: [
                        "\nSTINGER NITE Team 4 payload is currently launching:\n\n",
                        "<< " + param2 + " receiving payload " + param1 + " >>",
                        "\nEXECUTING...........",
                        "..................",
                        ".................!\n\n"
                    ], breakLine: false});
                };

                // Conditional messages returned based on filename given
                if (param1 === "undefined") {
                    session.output.push({
                        output: true, text: [
                            "You need to provide a payload name, type 'help stinger-pl' to get a hint."
                        ], breakLine: true
                    });
                } else if (param2 === "undefined") {
                    session.output.push({
                        output: true, text: [
                            "You need to provide a target name, type 'help stinger-pl' to get a hint."
                        ], breakLine: true
                    });
                } else if (param1 !== correct_payload) {
                    session.output.push({
                        output: true, text: [
                            "Payload failed against target!",
                            "Ensure you are using the proper payload or that the name is not incorrect.",
                            "Type 'help stinger-pl' to get a hint."
                        ], breakLine: true
                    });
                    payload_message();
                } else if (param2 !== correct_db) {
                    session.output.push({
                        output: true, text: [
                            "Payload failed against target!",
                            "Ensure you are authorized to attack target or that the name is not incorrect.",
                            "Type 'help stinger-pl' to get a hint."
                        ], breakLine: true
                    });
                    payload_message();
                } else if (param1 === correct_payload && param2 === correct_db) {
                    session.output.push({output: true, text: vehicle_list, breakLine: true});
                    session.output.push({
                        output: true, text: [
                            "System access obtained! Printing contents of system >>>\n\n",
                            "VENEZUELAN ARMY VEHICLE DATABASE-04\n",
                            "-----------------------------------\n\n",
                            "VEHICLE NAME\t\t\tQUANTITY",
                            "============\t\t\t========"
                        ], breakLine: false
                    });
                    payload_message();
                }
                else {
                    session.output.push({ output: true, text: [
                        "<" + param1 + "> could not be launched against <" + param2 + ">",
                        "Target name is incorrect or you are not authorized.",
                        "Type 'help stinger-pl' to get a hint."
                    ], breakLine: true });
                }
            };
            return me;
        };
        commandBrokerProvider.appendCommandHandler(stingerPayloadCommandHandler());


        //==============================================================================//
        // STINGER <Report> Command //
        //==============================================================================//

        var stingerReportCommandHandler = function () {

            var me = {};
            me.command = 'stinger-rp';
            me.description = ['Grants access to NITE Team 4 evidence and report database',
                "Example: stinger-rp DatabaseID (list all entries in report database)",
                "Example: stinger-rp DatabaseID ReportID (read a report from the database)",
                "Example: stinger-rp open ReportID (Opens the Archive and goes to the report)"
            ];

            var m26_db = "combdb-" + 4*7; // combdb-28
            var m26_rp1 = "sigilmalware" + 4*23; // sigilmal92
            var m26_rp1_arch = "NJ" + 7*6 + "KM"; // NJ42KM
            var m26_rp2 = "crypt" + 4*14; // crypt56
            var m26_rp2_arch = "JU" + 5*5 +"ZA"; // JU25ZA


            var m26_db_list = [
                m26_rp1 + "\tReport on the SIGIL malware sample",
                m26_rp2 + "\t\tEncrypted traffic from SIGIL malware sample"
            ];

            me.handle = function (session, param1, param2) {
                param1 = makeLower(param1);
                param2 = makeLower(param2);


                // Function to print out file name location and access status
                var report_message = function(db_name, report_name) {
                    session.output.push({ output: true, text: [
                        "\nAccessing NITE Team 4 report <" + report_name + "> from database <" + db_name + ">\n",
                        "\nREADING.............",
                        "..................",
                        ".................!\n\n"
                    ], breakLine: false});
                };

                // Conditional messages returned based on filename given
                if (param1 === "undefined") {
                    session.output.push({
                        output: true, text: [
                            "You need to provide a report database name, type 'help stinger-rp' to get a hint."
                        ], breakLine: true
                    });
                } else if (param1 === m26_db && param2 === "undefined") {
                    session.output.push({
                        output: true, text: m26_db_list, breakLine: true
                    });
                    session.output.push({
                        output: true, text: [
                            "\nNITE Team 4 Report & Evidence Database",
                            "------------------------------------\n\n",
                            "REPORT ID\t\tDESCRIPTION",
                            "=========\t\t==========="
                        ], breakLine: false
                    });
                } else if (param1 === "open" && param2 === m26_rp1) {
                    window.open("http://archive.blackwatchmen.com/search/" + m26_rp1_arch);
                } else if (param1 === "open" && param2 === m26_rp2) {
                    window.open("http://archive.blackwatchmen.com/search/" + m26_rp2_arch);
                } else if (param1 !== m26_db) {
                    session.output.push({
                        output: true, text: [
                            "Database <" + param1 + "> could not be accessed!",
                            "Ensure you are authorized for access or that the name is not incorrect.",
                            "Type 'help stinger-rp' to get a hint."
                        ], breakLine: true
                    });
                } else if (param1 === m26_db && param2 === m26_rp1) {
                    session.output.push({
                        output: true, text: [
                            "Dumping contents of report to >>> Archive Call #" + m26_rp1_arch
                        ], breakLine: true
                    });
                    report_message(param1, param2);
                } else if (param1 === m26_db && param2 === m26_rp2) {
                    session.output.push({
                        output: true, text: [
                            "Dumping contents of report to >>> Archive Call #" + m26_rp2_arch // JU25ZA
                        ], breakLine: true
                    });
                    report_message(param1, param2);
                } else if (param2 !== m26_rp1 || param2 !== m26_rp2) {
                    session.output.push({
                        output: true, text: [
                            "Report could not be read from <" + param1 + ">",
                            "Ensure you are authorized for access or that the name is not incorrect.",
                            "Type 'help stinger-rp' to get a hint."
                        ], breakLine: true
                    });
                } else {
                    session.output.push({ output: true, text: [
                        "<" + param2 + "> in <" + param1 + "> could not be accessed.",
                        "Name is incorrect or you are not authorized.",
                        "Type 'help stinger-rp' to get a hint."
                    ], breakLine: true });
                }
            };
            return me;
        };
        commandBrokerProvider.appendCommandHandler(stingerReportCommandHandler());

        //==============================================================================//
        // STINGER <Camera> Command //
        //==============================================================================//

        var stingerCameraCommandHandler = function () {
            var flag = false;
            var timer_started = false;
            function setFlag(status) {
                flag = status;
            }
            function setTimerStarted(status) {
                timer_started = status;
            }

            var me = {};
            me.command = 'stinger-cm';
            me.description = [
                "Hacks cameras in an infected facility.",
                "\n",
                "Example: stinger-cm list",
                "Example: stinger-cm select [insert camID]",
                "Example: stinger-cm [insert camID] [insert password guess]",
                "Example: stinger-cm abort [insert camID]",
                "Example: stinger-cm admin [insert password guess]",
                "Example: stinger-cm op-complete"
            ];

            var cam_list = {
                "cam32": 0,
                "cam21": 0,
                "cam30": 0,
                "cam55": 0,
                "cam41": 0,
                "cam65": 0,
                "cam19": 0,
                "cam74": 0,
                "cam49": 0
            };
            var selected_cam = null;
            var password_list = [
                "thesun",
                "beyond",
                "themountains",
                "glows",
                "theyellow",
                "riverseawards",
                "flowsyou",
                "canenjoy",
                "grander",
                "sightby",
                "climbingto",
                "greater",
                "height"
            ];
            var master_password = "wangzhihuan";
            var master_correct = false;
            var passid = null;
            var success_code = "VN" + 2*7 + "ZX";      // VN14ZX
            var timer = null;

            var passTimer = function() {
                setTimerStarted(true);
                setFlag(false);
                timer = window.setTimeout(function() {
                    setFlag(true);
                    setTimerStarted(false);
                    if (cam_list[selected_cam] !== 1) {
                        cam_list[selected_cam] = 2;
                    }
                }, 64000);
            };

            function setMaster(status) {
                master_correct = status;
            }

            me.handle = function (session, param1, param2) {
                param1 = makeLower(param1);
                param2 = makeLower(param2);

                switch(param1) {
                    case "list":
                        // 0 flag means no action has been taken on the camera
                        // 1 flag means that player succeeded in hacking the camera
                        // 2 flag means that player failed in hacking the camera
                        // 3 flag means that the player has begun a session on the camera
                        for (var key in cam_list) {
                            var value = cam_list[key];
                            var status_str = "";
                            if (value === 2) {
                                status_str = "Locked out";
                            } else if (value === 1) {
                                status_str = "Hacked"
                            } else if (value === 3) {
                                status_str = "Online (hacking in progress)"
                            } else {
                                status_str = "Online"
                            }
                            session.output.push({output: true, text: [key + ": " + status_str], breakLine: true});
                        }
                        session.output.push({ output: true, text: [
                            "\n",
                            "List of security cams and status:",
                            "=================================\n"
                        ], breakLine: true });
                        break;
                    case selected_cam:
                        // Has the timer run out for the selected camera?
                        if (flag === true) {
                            session.output.push({ output: true, text: [
                                "Time to access this camera has been exceeded!"
                            ], breakLine: true });
                            // If it has, was it previously listed as hacked?
                            if (cam_list[selected_cam] === 1) {
                                session.output.push({
                                    output: true, text: [
                                        "This camera has already been hacked!"
                                    ], breakLine: false
                                });
                                break;
                            }
                        } else if (cam_list[selected_cam] === 2) {               // The user was locked out
                            session.output.push({ output: true, text: [
                                "You're locked out of this camera!"
                            ], breakLine: true });
                        } else if(param2 === password_list[passid]) {    // The user guessed right
                            session.output.push({ output: true, text: [
                                "Accessing system................ Success!\n",
                                "The camera was hacked!"
                            ], breakLine: true });
                            cam_list[selected_cam] = 1;
                            setFlag(true);
                            setTimerStarted(false);
                        } else if (cam_list[selected_cam] === 1) {
                            session.output.push({ output: true, text: [
                                "The camera has already been hacked!"
                            ], breakLine: true });
                            break;
                        } else if (passid === null || selected_cam === null) {
                            session.output.push({ output: true, text: [
                                "An ANTENNA session for this camera was not started!"
                            ], breakLine: true });
                        } else if (param2 === "abort") {
                            session.output.push({ output: true, text: [
                                "Camera was aborted! You are now locked out of this camera."
                            ], breakLine: true });
                            cam_list[selected_cam] = 2;
                            setFlag(true);
                            setTimerStarted(false);
                        }
                        else {
                            session.output.push({ output: true, text: [
                                "The password was incorrect."
                            ], breakLine: true });
                        }
                        break;
                    case "select":
                        if (timer_started === true) {
                            session.output.push({ output: true, text: [
                                "An ANTENNA session is still running for a camera!",
                                "Complete the hack for that camera or wait until timer ends."
                            ], breakLine: true });
                            break;
                        }

                        // Set selected cam to the user supplied camera
                        selected_cam = param2;

                        // Do a check to see if the user has locked up the camera in a previous attempt
                        if (cam_list[selected_cam] === 2) {
                            session.output.push({ output: true, text: [
                                "You're locked out of this camera!"
                            ], breakLine: true });
                            break;
                        } else if (cam_list[selected_cam] === 3) {
                            session.output.push({ output: true, text: [
                                "ANTENNA session for camera has already started!"
                            ], breakLine: true });
                            break;
                        } else if (cam_list[selected_cam] === 1) {
                            session.output.push({ output: true, text: [
                                "This camera has already been hacked!"
                            ], breakLine: true });
                            break;
                        } else if (cam_list[selected_cam] === 0) {
                            window.clearTimeout(timer);
                        } else {
                            session.output.push({ output: true, text: [
                                "This camera does not exist!",
                                "Enter 'stinger-cm status' to see full list of cameras."
                            ], breakLine: true });
                            break;
                        }

                        // Reset the timed out flag
                        setFlag(false);
                        // Remove the selected password if one was picked last round.
                        if (passid !== null) {
                            delete password_list[passid];
                        }
                        // Select a random password for the camera
                        passid = Math.floor((Math.random() * password_list.length) + 1);
                        var cam_password = password_list[passid];
                        if (cam_password === undefined) {
                            while (cam_password === undefined) {
                                passid = Math.floor((Math.random() * password_list.length) + 1);
                                cam_password = password_list[passid];
                            }
                        }
                        var random_letter_num1 = Math.floor((Math.random() * cam_password.length) + 1);
                        var random_letter_num2 = Math.floor((Math.random() * cam_password.length) + 1);
                        var random_letter_1 =  cam_password[random_letter_num1];
                        var random_letter_2 = cam_password[random_letter_num2];
                        if (random_letter_1 === undefined) {
                            while (random_letter_1 === undefined) {
                                random_letter_num1 = Math.floor((Math.random() * cam_password.length) + 1);
                                random_letter_1 = cam_password[random_letter_num1];
                            }
                        } else if (random_letter_2 === undefined) {
                            while (random_letter_2 === undefined) {
                                random_letter_num2 = Math.floor((Math.random() * cam_password.length) + 1);
                                random_letter_2 = cam_password[random_letter_num2];
                            }
                        }
                        else if (random_letter_num1 === random_letter_num2) {
                            while (random_letter_num1 === random_letter_num2) {
                                random_letter_num2 = Math.floor((Math.random() * cam_password.length) + 1);
                                random_letter_2 = cam_password[random_letter_num2];
                            }
                        }
                        var hashed_password = cam_password.replace(random_letter_1, "#").replace(random_letter_2, "#");
                        session.output.push({ output: true, text: [
                            "Entering computer for <" + selected_cam + ">",
                            "Listening to microphone...",
                            "Background noise detected, attempting to catch as many keys as possible...",
                            "Password relogin error thrown...",
                            "Waiting on input...",
                            "...................",
                            "...................",
                            "...................",
                            "...................",
                            "...................",
                            "...................",
                            "...................",
                            "...................",
                            "...................",
                            "...................",
                            "...................",
                            "...................",
                            "...................",
                            "...................",
                            "...................",
                            "...................",
                            "................!!!",
                            "\nA password was entered! ANTENNA caught the following keys:\n",
                            "\n>>>[ " +  hashed_password + " ]<<<\n\n",
                            "You have 1 minute remaining to enter the correct password for <" + selected_cam + ">"
                        ], breakLine: true });
                        passTimer();
                        // We set this camera as having begun a session
                        cam_list[selected_cam] = 3;
                        break;
                    case "admin":
                        if (param2 === master_password) {
                            setMaster(true);
                            session.output.push({ output: true, text: [
                                "Security camera system admin access granted!"
                            ], breakLine: true });
                        } else {
                            session.output.push({ output: true, text: [
                                "Password incorrect!",
                                "\n",
                                "Did you forget your password? This is your hint: Chinese"
                            ], breakLine: true });
                        }
                        session.output.push({ output: true, text: [
                            "\n",
                            "Security Camera Admin Login",
                            "==========================="
                        ], breakLine: false });
                        break;
                    case "op-complete":
                        var success_cnt = 0;
                        for (var key in cam_list) {
                            if (cam_list[key] === 1) {
                                success_cnt++;
                            }
                        }
                        if (success_cnt >= 5 && master_correct === true) {
                            session.output.push({ output: true, text: [
                                "Operation completed successfully! Success code is " + success_code
                            ], breakLine: true });
                            break;
                        } else {
                            session.output.push({ output: true, text: [
                                success_cnt + "/" + Object.keys(cam_list).length + " cameras were hacked. Admin access and minimum 5/" + Object.keys(cam_list).length + " needed to complete mission."
                            ], breakLine: true });
                            break;
                        }
                    default:
                        session.output.push({ output: true, text: [
                            "Command could not execute!"
                        ], breakLine: true });
                        break;
                }
            };
            return me;
        };
        commandBrokerProvider.appendCommandHandler(stingerCameraCommandHandler());


        //==============================================================================//
        // STINGER <Strike> Command //
        //==============================================================================//

        var stingerStrikeCommandHandler = function () {

            var me = {};
            me.command = 'stinger-str';
            me.description = ['Command a strike team through the STINGER interface.',
                "\n",
                "Example: stinger-str list",
                "Example: stinger-str status [insert room_id]",
                "Example: stinger-str set [insert room_id] [insert feature id] [on/off]",
                "Example: stinger-str enter [insert room_id]",
                "Example: stinger-str istealer [insert room_id]",
                "Example: stinger-str exit [insert room_id]",
                "Example: stinger-str log check",
                "Example: stinger-str log [insert decision_id] [y/n]",
                "Example: stinger-str op-complete"
            ];

            var room_1 = {
                "door": 0,
                "motion": 0,
                "bioauth": 0,
                "distraction": 0,
                "occupied": 0,
                "setDoor": function(status) {
                    room_1.door = status;
                },
                "setMotion": function(status) {
                    room_1.motion = status;
                },
                "setBioauth": function(status) {
                    room_1.bioauth = status;
                },
                "setDistraction": function(status) {
                    room_1.distraction = status;
                },
                "setOccupied": function(status) {
                    room_1.occupied = status;
                },
                "getDoor": function() {
                    return room_1.door;
                },
                "getMotion": function() {
                    return room_1.motion;
                },
                "getBioauth": function() {
                    return room_1.bioauth;
                },
                "getDistraction": function() {
                    return room_1.distraction;
                },
                "getOccupied": function() {
                    return room_1.occupied;
                }
            };

            var room_success = [0, 0, 0];
            var room_status = [];

            var checkSuccess = function (room_stats) {
                if (room_stats.toString() !== room_success.toString()) {
                    console.log("Room did not succeed");
                } else if (room_stats.toString() === room_success.toString()) {
                    console.log("Room succeeded!");
                }
            };

            var printRoomStatus = function (room_id) {
                var status_list = [];
                if (room_id.getDoor() === 0) {
                    status_list[0] = "# Door off";
                } else if (room_id.getDoor() === 1) {
                    status_list[0] = "# Door on";
                }
                if (room_id.getMotion() === 0) {
                    status_list[1] = "# Motion detection off";
                } else if (room_id.getMotion() === 1) {
                    status_list[1] = "# Motion detection on";
                }
                if (room_id.getBioauth() === 0) {
                    status_list[2] = "# Bioauthentication off";
                } else if (room_id.getBioauth() === 1) {
                    status_list[2] = "# Bioauthentication on";
                }
                console.log(status_list);
                return status_list;
            };

            var createRoomConfig = function(room_user_input, room_id) {
                var room_user_config = room_user_input.toString().split("-");
                var room_user_config_int = [0, 0, 0];
                for (var i = 0; i < room_user_config.length; i++) {
                    room_user_config_int[i] = parseInt(room_user_config[i]);
                }
                room_id.setDoor(room_user_config_int[0]);
                room_id.setMotion(room_user_config_int[1]);
                room_id.setBioauth(room_user_config_int[2]);
                console.log(room_id);
                console.log(room_user_config_int);
                return room_user_config_int;
            };

            me.handle = function (session, param1, param2) {
                switch(param1) {
                    case "room_1":
                        room_status = createRoomConfig(param2, room_1);
                        checkSuccess(room_status);
                        session.output.push({output: true, text: printRoomStatus(room_1), breakLine: true});
                        break;
                    case "status":
                        session.output.push({output: true, text: printRoomStatus(room_1), breakLine: true});
                        session.output.push({output: true, text: ["\nRoom #1 Status:\n====================\n"], breakLine: false});
                        break;
                    case "distraction":
                        switch(param2) {
                            case "room_1":
                                room_1.setDistraction(1);
                                console.log(room_1.getDistraction());git
                                break;
                            default:
                                console.log("Error");
                                break;
                        }
                        break;
                    default:
                        console.log("Error with room!");
                        break;
                }
            };
            return me;
        };
        commandBrokerProvider.appendCommandHandler(stingerStrikeCommandHandler());

        //===============================================================================================//
        //======= END OF HACKING TERMINAL COMMANDS CODE =================================================//
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