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
    // STINGER <Strike> Command //
    //==============================================================================//

    var stingerStrikeCommandHandler = function () {

        var door_1 = {
            "id": 1,
            "name": "Rift Entity Containment Lab",
            "win_message": "The strike team reports multiple rift entities sedated and attached to monitoring equipment.\n\n",
            "clue": "..a2/...Alpha.3,,4Numeric///...Password\n...===?//...Dia./gonal.Ri.ght...Down./+_",
            "hint": "!!!.....+,..+,,,///>!Three-Rails./##.../+",
            "ciphertext": "\n>>>P.A/SSWOR,D: >>> BNAH RORA UMCL",
            "plaintext": "BRUNOMARCHAL",
            "complete": false,
            "set_complete": function(status) {
                door_1.complete = status;
            },
            "get_complete": function() {
                if (door_1.complete === true) {
                    return "OPEN";
                } else {
                    return "LOCKED";
                }
            }
        };
        var door_2 = {
            "id": 2,
            "name": "Records & Program Archive Office",
            "win_message": "Several archives on current SIGIL programs and personnel are in the room, should provide excellent intel on operations.\n\n",
            "clue": "..43%%...%%!..Alpha.3,,4Numeric///...Password\n-->>...Co.de$$..//Nam.#e--+Ram.say--///.\nCODEW.ORD./SATURN/..KEY=MANY",
            "hint": ["!!!.....SATUR./##.../1","!!!.....NBCDE./##.../1","!!!.....FGH(I/J)K./##.../1","!!!.....LMOPQ./##.../1","!!!.....VWXYZ./##.../1"],
            "ciphertext": "\n>>>P.A/SSWOR,D: >>> 54 53 33 75 74 26 34 87",
            "plaintext": "ALANGUTH",
            "complete": false,
            "set_complete": function(status) {
                door_2.complete = status;
            },
            "get_complete": function() {
                if (door_2.complete === true) {
                    return "OPEN";
                } else {
                    return "LOCKED";
                }
            }
        };
        var door_3 = {
            "id": 3,
            "name": "Counterintelligence Technologies Branch",
            "win_message": "Files on Black Watchmen agents were found, along with research program details for equipment designed to perform surveillance on SIGIL targets.\n\n",
            "clue": ["!..Alpha.3,,4Numeric///...Password","...>%%$...//Mar.k//___.Vic.tor//._Queb%ec//...Lub.yanka..","QAZWFDKUJCERBPXVOTYSIHLGNM/.","...//..2...#$.SPAR.ES=(3,7)<<../"],
            "hint": "!!!.....0,..22,,,///>!..///@###H.ollo.w(()----..C.oin>.,Checke.r()(Boar.d/2...../##.../1",
            "ciphertext": "\n>>>P.A/SSWOR,D: >>> 6723239323323273",
            "plaintext": "DIETERZEH",
            "complete": false,
            "set_complete": function(status) {
                door_3.complete = status;
            },
            "get_complete": function() {
                if (door_3.complete === true) {
                    return "OPEN";
                } else {
                    return "LOCKED";
                }
            }
        };

        var success_code = "PL" + (7*13) + "BW";

        var me = {};
        me.command = 'stinger-str';
        me.description = ['Provide strike team support from the STINGER terminal.',
            "\n",
            "Example: stinger-str list",
            "Example: stinger-str imp <door_id>",
            "Example: stinger-str login <door_id> <password>",
            "Example: stinger-str op-complete"
        ];


        me.handle = function (session, param1, param2, param3) {

            switch(param1) {
                // Door hack command
                case "imp":
                    switch(param2) {
                        case "door_1":
                            if (param3 === "--deep") {
                                session.output.push({ output: true, text: [
                                    "\n[[DEEP SEARCH INITIATED...]]\n",
                                    "\nPrinting results of door access system implant:\n\n",
                                    door_1.clue,
                                    "\n" + door_1.hint,
                                    door_1.ciphertext
                                ], breakLine: true });
                            } else {
                                session.output.push({ output: true, text: [
                                    "\nPrinting results of door access system implant:\n\n",
                                    door_1.clue,
                                    door_1.ciphertext
                                ], breakLine: true });
                            }
                            break;
                        case "door_2":
                            if (param3 === "--deep") {
                                session.output.push({ output: true, text: [door_2.ciphertext], breakLine: true });
                                session.output.push({ output: true, text: door_2.hint, breakLine: false });
                                session.output.push({ output: true, text: [
                                    "\n[[DEEP SEARCH INITIATED...]]\n",
                                    "\nPrinting results of door access system implant:\n\n",
                                    door_2.clue
                                ], breakLine: true });
                            } else {
                                session.output.push({ output: true, text: [
                                    "\nPrinting results of door access system implant:\n\n",
                                    door_2.clue,
                                    door_2.ciphertext
                                ], breakLine: true });
                            }
                            break;
                        case "door_3":
                            if (param3 === "--deep") {
                                session.output.push({output: true, text: [door_3.ciphertext], breakLine: true});
                                session.output.push({output: true, text: [door_3.hint], breakLine: false});
                                session.output.push({output: true, text: door_3.clue, breakLine: true});
                                session.output.push({ output: true, text: [
                                    "\n[[DEEP SEARCH INITIATED...]]\n",
                                    "\nPrinting results of door access system implant:\n"
                                ], breakLine: true });
                            } else {
                                session.output.push({output: true, text: [door_3.ciphertext], breakLine: true});
                                session.output.push({output: true, text: door_3.clue, breakLine: false});
                                session.output.push({ output: true, text: [
                                    "\nPrinting results of door access system implant:\n"
                                ], breakLine: true });
                            }
                            break;
                        default:
                            console.log("Error with command!");
                            break;

                    }
                    break;
                // Password submit command
                case "login":
                    switch(param2) {
                        case "door_1":
                            if (param3 === door_1.plaintext) {
                                // Set door as completed here
                                door_1.set_complete(true);
                                session.output.push({ output: true, text: [
                                    "\n",
                                    "Door was hacked successfully!\n",
                                    "\n",
                                    // Add door win message here
                                    door_1.win_message,
                                    "iStealer beacon devices are activated, scanning for data sources... Loading modules....\n",
                                    "[0%>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>100%]\n",
                                    "\n",
                                    "Cable attachment detected, downloading data...\n",
                                    "[0%>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>100%]\n",
                                    "\n",
                                    "Data exfiltration complete! Exit command sent. Extracted supervising officer name: HILSHIRE"
                                ], breakLine: true });
                            }
                            break;
                        case "door_2":
                            if (param3 === door_2.plaintext) {
                                // Set door as completed here
                                door_2.set_complete(true);
                                session.output.push({ output: true, text: [
                                    "\n",
                                    "Door was hacked successfully!\n",
                                    "\n",
                                    // Add door win message here
                                    door_2.win_message,
                                    "iStealer beacon devices are activated, scanning for data sources... Loading modules....\n",
                                    "[0%>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>100%]\n",
                                    "\n",
                                    "Cable attachment detected, downloading data...\n",
                                    "[0%>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>100%]\n",
                                    "\n",
                                    "Data exfiltration complete! Exit command sent. Extracted supervising officer name: CROFTMORE"
                                ], breakLine: true });
                            }
                            break;
                        case "door_3":
                            if (param3 === door_3.plaintext) {
                                // Set door as completed here
                                door_3.set_complete(true);
                                session.output.push({ output: true, text: [
                                    "\n",
                                    "Door was hacked successfully!\n",
                                    "\n",
                                    // Add door win message here
                                    door_3.win_message,
                                    "iStealer beacon devices are activated, scanning for data sources... Loading modules....\n",
                                    "[0%>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>100%]\n",
                                    "\n",
                                    "Cable attachment detected, downloading data...\n",
                                    "[0%>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>100%]\n",
                                    "\n",
                                    "Data exfiltration complete! Exit command sent. Extracted supervising officer name: HASKELL"
                                ], breakLine: true });
                            }
                            break;
                        default:
                            console.log("Error with command!");
                            break;
                    }
                    break;
                // Operation success check command
                case "op-complete":
                    if (door_1.complete === true && door_2.complete === true && door_3.complete === true) {
                        session.output.push({ output: true, text: [
                            "\n",
                            "Mission is a success!",
                            "\n",
                            "All high value rooms cleared and data obtained. Moving on to other sections of facility...\n",
                            "\n",
                            "Success code: " + success_code
                        ], breakLine: true });
                    } else {
                        session.output.push({ output: true, text: [
                            "\n",
                            "Success conditions not met, continue mission and clear all rooms.",
                            "\n",
                            "To check the status of the doors we need to crack, use the 'stinger-str list' command"
                        ], breakLine: true });
                    }
                    break;
                // Door status check command
                case "list":
                    session.output.push({ output: true, text: [
                        "\n",
                        "door_1 : " + door_1.get_complete(),
                        "\n",
                        "door_2 : " + door_2.get_complete(),
                        "\n",
                        "door_3 : " + door_3.get_complete()
                    ], breakLine: true });
                    break;
                default:
                    console.log("Error with command!");
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
