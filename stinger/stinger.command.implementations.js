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
                console.log(param2);
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

        var me = {};
        me.command = 'stinger-cm';
        me.description = [
            "Hacks cameras in an infected facility."
        ];

        var cam_list = {"cam43": 0, "cam21": 0, "cam30": 0};
        var selected_cam = null;
        var password_list = "aerate ,aerier ,airier ,aortas ,arises ,arrest ,artier ,artist ,assert ,assess ,assets ,assist ,assort ,asters ,attest ,attire ,easers ,easier ,easter ,eaters ,eerier ,eraser ,erases ,errata ,errors ,estate ,esters ,irises ,iritis ,orates ,orator ,otitis ,otters ,raiser ,raises ,rarest ,raster ,raters ,ratios ,ratter ,reseat ,resets ,resist ,resits ,resort ,rester ,retest ,reties ,retire ,retort ,retree ,rioter ,risers ,roarer ,roasts ,roosts ,rooter ,rosier ,roster ,rotate ,rotors ,rotter ,sasses ,satire ,searer ,seater ,serest ,series ,sestet ,settee ,setter ,sierra ,siesta ,sister ,sitars ,sitter ,soarer ,soiree ,sorest ,sorter ,sortie ,stairs ,starer ,stares ,starts ,stasis ,stater ,states ,steers ,stereo ,stores ,strait ,strata ,street ,stress ,tarots ,tartar ,tarter ,taster ,tastes ,tatoos ,tatter ,tattoo ,tearer ,teaser ,teases ,teeter ,terete ,terror ,terser ,tester ,testes ,tetras ,tiaras ,titter ,toasts ,tooter ,tories ,torsos ,tortes ,tosses ,toters ,totter ,traits ,treats ,triers ,tsetse ,adorer ,adores ,adroit ,aerial ,aiders ,aisles ,alerts ,altars ,alters ,anises ,anotia ,aortal ,ardors ,arenas ,areola ,areole ,arisen ,arouse ,assail ,assent ,assure ,astern ,astral ,astute ,atoner ,atones ,atonia ,atrial ,attain ,aurora ,daises ,darter ,daters ,dearer ,dearie ,deists ,derris ,desert ,desire ,desist ,deters ,detest ,dieter ,direst ,disses ,dittos ,driers ,driest ,earner ,easels ,editor ,eiders ,elater ,elates ,elites ,enters ,entire ,entree ,eosine ,erased ,erodes ,errant ,estrus ,idiots ,insert ,insets ,insist ,iodise ,iolite ,ionise ,iridis ,islets ,issuer ,issues ,lariat ,lasers ,lasses ,lassie ,lassos ,latest ,latite ,latter ,lattes ,leaser ,leases ,lesser ,lester ,letter ,liaise ,liters ,litres ,litter ,loiter ,looser ,looses ,looter ,losers ,losses ,nairas ,natter ,nearer ,neater ,nester ,netter ,noises ,nooser ,nooses ,norite ,nosier ,notate ,odessa ,oilers ,oilier ,onsets ,onsite ,oolite ,ootids ,orated ,orders ,orient ,oriole ,ornate ,ouster ,outers ,outsee ,outset ,radars ,radios ,raider ,raised ,raisin ,ranter ,ration ,ratted ,rattle ,reader ,realer ,reared ,reason ,redate ,redose ,reedit ,reeler ,relast ,relate ,relier ,relies ,relist ,renest ,renter ,reoils ,reread ,rerent ,resaid ,resail ,resale ,reseal ,reseed ,resent ,reside ,resins ,resods ,resole ,rested ,retail ,retain ,retard ,retied ,retina ,retool ,retorn ,retour ,retuse ,reuses ,riders ,rinser ,rinses ,rioted ,roadie ,roared ,rodeos ,rooted ,rosins ,rotted ,rotten ,rouses ,router ,routes ,russet ,sadist ,sailer ,sailor ,saints ,salter ,sanest ,sassed ,sateen ,satins ,sautes ,sealer ,seared ,season ,seated ,sedate ,seeder ,senate ,senior ,senora ,senors ,senses ,sensor ,serail ,serene ,serial ,serine ,serous ,settle ,sirens ,sitins ,slater ,slates ,sleets ,sliest ,snarer ,snares ,sneers ,snoots ,snorer ,snores ,snorts ,soared ,sonars ,sonata ,sooner ,sooted ,sorrel ,sorted ,sourer ,stains ,staler ,stales ,stared ,stated ,staten ,statin ,statue ,status ,steals ,steeds ,steels ,steins ,stenos ,stents ,sterns ,sterol ,stilts ,stints ,stoles ,stoner ,stones ,stools ,stored ,strain ,stride ,strode ,struts ,suiter ,suites ,suitor ,surest ,tailor ,taints ,tarred ,tarsal ,tarsus ,tartan ,tassel ,tasted ,tattle ,tauter ,teared ,teased ,teated ,tenets ,tenors ,tenser ,tenses ,tensor ,tenter ,teslas ,tested ,tidier ,tidies ,tiered ,tilers ,tilter ,tinier ,tinter ,tirade ,tissue ,titans ,titles ,toiler ,toilet ,toners ,tooler ,toonie ,tooted ,tootle ,toroid ,torrid ,tossed ,totals ,tourer ,touter ,trader ,trades ,trails ,trains ,treads ,triads ,trials ,triode ,trouts ,truest ,trusts ,turret ,tutors ,ureter ,utters ,adders ,adieus ,adored ,adorns ,aether ,agates ,agrees ,airish ,aisled ,alders ,aldose ,aliens ,allier ,allies ,allots ,anions ,anodes ,anoint ,antler ,antral ,anuses ,ardent ,ardour ,ariary ,arrays ,artery ,ashier ,ashore ,assays ,astray ,atolls ,atonal ,atoned ,attend ,attune ,audios ,audits ,auntie ,aureus ,dadoes ,dalasi ,darner ,darted ,deader ,dealer ,delate ,delete ,delist ,deltas ,denars ,denier ,denies ,denote ,denser ,deodar ,derail ,deride ,desalt ,deseed ,detail ,detain ,detent ,detour ,dialer ,diesel ,dieted ,dilate ,dinars ,diners ,diodes ,dissed ,distal ,disuse ,donair ,donate ,donors ,doored ,dorsal ,dotard ,dotted ,douser ,douses ,drains ,dreads ,droids ,drones ,drools ,duress ,duster ,duties ,earned ,earths ,eatery ,eddies ,edited ,egoist ,egress ,egrets ,either ,elated ,elders ,eldest ,elides ,elodea ,elutes ,endear ,enders ,enlist ,enrols ,ensues ,ensure ,entail ,eolian ,eroded ,errand ,essays ,ethers ,gaiter ,garret ,garter ,gasser ,gasses ,gators ,getter ,goatee ,goiter ,gooier ,gooses ,gorier ,grater ,grates ,gratis ,grease ,greats ,greets ,grotto ,harass ,hastes ,haters ,hatter ,hearer ,hearse ,hearts ,heater ,heists ,hereto ,heroes ,hisser ,hisses ,hitter ,hoarse ,hoists ,horror ,horses ,hosers ,hosier ,hostas ,hotair ,hotter ,ideals ,idents ,idlers ,idlest ,illite ,inanes ,indies ,indite ,indoor ,inlets ,innate ,inroad ,insane ,inside ,insole ,insure ,intent ,intern ,intron ,iodide ,iodine ,ironed ,issued ,ladies ,laired ,larder ,lasted ,latent ,latino ,leader ,leaner ,leanto ,learns ,learnt ,leased ,leered ,lenite ,lenses ,leones ,lesion ,lessen ,lesson ,lilies ,linear ,liners ,listed ,listen ,little ,loader ,loaner ,loners ,loonie ,loosed ,loosen ,looted ,lotion ,louses ,lurers ,luster ,lustre ,naiads ,nailer ,nasals ,nation ,nature ,nausea ,neared ,neaten ,needer ,nested ,nestle ,netted ,nettle ,neuter ,noised ,nonart ,noosed ,nosean ,notion ,nurser ,nurses ,nutter ,oddest ,odious ,odored ,odours ,ogress ,oldest ,oldies ,onions ,oodles ,ooidal ,ordain ,ordeal ,others ,ousted ,outlet ,outlie ,outran ,oyster ,radial ,radian ,radius ,radons ,ragers ,raided ,railed ,rained ,ranted ,rarity ,rasher ,rashes ,rather ,readds ,redder ,redeal ,redial ,redone ,redons ,reeled ,regear ,regret ,rehear ,reheat ,rehire ,reined ,relaid ,relent ,relied ,reline ,reload ,reloan ,renail ,renals ,render ,rental ,rented ,reroll ,reruns ,resand ,resays ,resell ,resend ,reshoe ,reshot ,resold ,result ,retags ,retell ,retold ,return ,reused ,rigors ,rilles ,rillet ,rinsed ,ritual ,rodder ,rodent ,rogers ,roiled ,roller ,rosary ,rotary ,roused ,routed ,rudest ,rulers ,rusted ,rustle ,rutile ,rutted ,sadder ,sagest ,sagier ,sailed ,salads ,saline ,salons ,saloon ,salted ,salute ,sander ,sashes ,satyrs ,saunas ,sayers ,sayest ,sealed ,sedans ,seeded ,seethe ,seller ,sender ,senile ,sennas ,sensed ,serges ,sharer ,shares ,shears ,sheers ,sheets ,shiest ,shires ,shirts ,shoers ,shoots ,shores ,shorts ,sidler ,sidles ,sieges ,sienna ,silent ,silted ,sinner ,slants ,slated ,slider ,slides ,snails ,snared ,snarls ,snider ,snored ,snouts ,soiled ,solder ,solids ,soloed ,solute ,sonnet ,soothe ,sooths ,sordid ,soured ,stager ,stages ,staled ,stalls ,stands ,starry ,stayer ,stills ,stogie ,stolen ,stolid ,stoned ,stooge ,storey ,strand ,strays ,stroll ,studio ,stunts ,sudser ,sudses ,suedes ,suited ,sunset ,suture ,tailed ,talent ,taller ,talons ,tanner ,target ,tarnal ,taunts ,tauten ,teethe ,teller ,telnet ,tenant ,tender ,tenner ,tennis ,tensed ,tented ,tenure ,tether ,teuton ,theirs ,theist ,theres ,theses ,thesis ,thetas ,thirst ,threat ,threes ,throat ,throes ,tidied ,tigers ,tildes ,tiller ,tilted ,tinder ,tinner ,tinsel ,tinted ,tithes ,titled ,toasty ,toiled ,toledo ,toller ,tondos ,tonnes ,tonsil ,tooled ,tooths ,tootsy ,toured ,tousle ,touted ,traded ,treaty ,trends ,triage ,trills ,trolls ,truant ,trysts ,tuners ,turner ,turtle ,tussle ,ultras ,unease ,uniter ,unites ,unrest ,unroot ,unseat ,untier ,unties ,urines ,uterus ,yarest ,yeasts ,yesses ,yester ,yttria ,abaser ,abases ,abater ,abates ,abator ,aborts ,across ,actors ,adages ,addler ,addles ,adhere ,adults ,afters ,agents ,agreed ,aimers ,airdry ,airily ,airing ,allele ,allied ,allure ,amrita ,angers ,annals ,anneal ,anodal ,anther ,aortic ,aptest ,arbors ,aready ,argent ,argons ,arguer ,argues ,armers ,armets ,armies ,armors ,aromas ,around ,arrows ,artily ,aspire ,assign ,attics ,augers ,augite ,author ,awaits ,barest ,barite ,barter ,basest ,basses ,basset ,baster ,bastes ,batter ,bearer ,beasts ,beater ,berate ,berets ,besets ,besort ,besots ,bestir ,better ,biases ,biotas ,bistro ,biters ,bitter ,boasts ,boater ,booses ,boosts ,borate ,borers ,bosses ,braise ,breast ,briars ,briers ,brises ,caesar ,carats ,career ,carers ,caress ,carets ,caries ,carrot ,carter ,caster ,castes ,castor ,caters ,ceases ,cerise ,cities ,coarse ,coasts ,cootie ,corers ,corset ,cosier ,cosies ,costar ,cotter ,crater ,crates ,crease ,create ,crests ,criers ,crises ,crisis ,crista ,crores ,dalton ,dander ,darned ,dasher ,dashes ,daunts ,deaden ,dearth ,deaths ,deeded ,degree ,dehort ,delead ,delint ,denial ,denied ,dental ,dented ,dentil ,dentin ,derays ,detune ,dhotis ,dialed ,digest ,digits ,dilute ,dinner ,dirges ,dishes ,dither ,dogear ,dogsat ,dogsit ,dollar ,donuts ,doodad ,doodle ,dosage ,doused ,dreary ,dressy ,drills ,droned ,druids ,dryers ,dueler ,dunite ,durian ,dusted ,eagles ,eaglet ,easily ,easing ,eating ,eddied ,edgers ,edgier ,eerily ,elided ,eludes ,eluent ,eluted ,emesis ,emotes ,endure ,enrage ,enroll ,ensued ,entity ,erects ,erotic ,erring ,escort ,esprit ,esteem ,ethane ,ethene ,eyelet ,faerie ,fairer ,faster ,fatter ,fearer ,feasts ,ferret ,ferris ,fester ,fetter ,fiesta ,firers ,firsts ,fitter ,footer ,forest ,forsee ,fortes ,foster ,freest ,friars ,frosts ,gainer ,gaited ,galoot ,galore ,garner ,garnet ,gaslit ,gassed ,geared ,gelato ,genera ,genies ,genres ,geodes ,geoids ,giants ,girder ,girlie ,glares ,gleets ,gloats ,gneiss ,gnoses ,gnosis ,goalie ,goners ,goodie ,goosed ,gotten ,grader ,grades ,grails ,grains ,grants ,grated ,greens ,groans ,groins ,grouse ,grouts ,guests ,guises ,guitar ,gusset ,gutter ,hairdo ,haired ,halite ,haloes ,halter ,harder ,harlot ,hassle ,hasted ,hasten ,hatred ,hatted ,header ,healer ,heated ,heired ,helios ,herder ,herein ,hereon ,hernia ,heroin ,herons ,hiatal ,hiatus ,hiders ,hinter ,hissed ,hoards ,holier ,honest ,honors ,hoodie ,hoodoo ,hooted ,hordes ,hornet ,horrid ,horsed ,hosted ,hostel ,hotels ,hotrod ,hotted ,houses ,hurter ,ibises ,iciest ,igloos ,ignite ,ignore ,indeed ,indent ,ingest ,ingots ,inlaid ,inline ,insult ,intend ,inured ,island ,isobar ,isomer ,keeker ,kiosks ,laager ,ladder ,laddie ,ladles ,lagers ,lahars ,lander ,larded ,larger ,larges ,lasher ,lashes ,lather ,lathes ,laurel ,layers ,leaded ,leaden ,leaned ,legate ,lender ,lentil ,ligase ,ligate ,lineal ,linens ,linnet ,lintel ,loaded ,loaned ,loathe ,louder ,loused ,lunars ,lunate ,lunier ,lunies ,lusted ,luteal ,lyases ,lyrate ,marrer ,masses ,master ,maters ,matter ,mattes ,meeter ,merest ,merits ,messes ,meteor ,meters ,metres ,metros ,miosis ,mirror ,misers ,misses ,mister ,miters ,mitier ,mitres ,mooter ,morass ,morose ,mortar ,mosses ,motors ,mottos ,nailed ,needed ,needle ,negate ,nelson ,nether ,neural ,neuron ,nodder ,noload ,nonane ,nonene ,nonoil ,nonuse ,noodle ,noseys ,notary ,nudest ,nudist ,nursed ,nutted ,oaring ,oboist ,obsess ,octets ,oglers ,oilrig ,online ,oolith ,operas ,opiate ,orange ,orbits ,organs ,origin ,ornery ,orogen ,outage ,outdid ,outgas ,outrig ,outrun ,parers ,parrot ,parser ,parses ,passer ,passes ,pastes ,pastor ,patios ,patter ,perter ,pester ,pestos ,peters ,petite ,pietas ,pirate ,pitier ,pities ,pitter ,poises ,poorer ,porter ,posers ,posies ,posits ,posses ,posset ,poster ,potato ,potter ,praise ,prater ,prates ,preset ,priest ,priors ,ptosis ,rabies ,racers ,racier ,racist ,radish ,radula ,rafter ,ragout ,ranger ,ranges ,rapers ,rapist ,raptor ,rarely ,raring ,rasper ,rating ,rattly ,rawest ,rayons ,reacts ,reagin ,realty ,reamer ,reaper ,rearms ,rebait ,rebars ,rebate ,rebite ,reboot ,rebore ,recase ,recast ,recess ,recite ,recoat ,rector ,redden ,redeye ,redrag ,redyes ,reemit ,refers ,refire ,refits ,regain ,regale ,regard ,regent ,region ,reheel ,reigns ,relays ,relish ,relogs ,remate ,remeet ,remiss ,remits ,remote ,renege ,repair ,repass ,repeat ,report ,repose ,repost ,repots ,rerape ,reroof ,resaws ,resews ,reshod ,resift ,resign ,resiny ,resorb ,resows ,respot ,restem ,retape ,retaps ,retrap ,retrim ,rewets ,rewire ,rhesus ,rhinos ,ribose ,ricers ,ridded ,ridden ,riddle ,ridges ,rigids ,rigour ,rinded ,ringer ,ripest ,rising ,riyals ,roamer ,robots ,rodded ,rogues ,rolled ,roofer ,roomer ,ropers ,ropier ,rosily ,rotgut ,rotund ,rounds ,rowers ,royals ,rudder ,rugrat ,ruined ,runner ,rusher ,rushes ,sabers ,sabres ,sadden ,saddle ,safari ,safest ,salary ,sandal ,sanded ,sanity ,sashed ,sating ,satiny ,sawers ,scarer ,scares ,scoots ,scorer ,scores ,screes ,scrota ,seadog ,seamer ,secret ,sector ,sedges ,seeing ,seesaw ,segues ,seismo ,sentry ,sepias ,sepsis ,septae ,septet ,serape ,serifs ,sering ,sesame ,sewers ,shader ,shades ,shales ,shards ,shared ,sheens ,shiner ,shines ,shoals ,shooed ,shored ,shouts ,shreds ,shrine ,sidled ,sieged ,sifter ,signee ,signer ,signet ,singer ,singes ,sinned ,siring ,siting ,slatey ,slayer ,sleety ,sloths ,slyest ,smarts ,smears ,smiter ,smites ,snooty ,snotty ,soaper ,sobers ,sodded ,sodden ,softer ,softie ,somers ,somite ,sorbet ,sorely ,sorrow ,souled ,sounds ,sowers ,sparer ,spares ,sparse ,spears ,spiers ,spirea ,spires ,spirit ,spirts ,spites ,spoors ,spores ,sports ,sprats ,sprees ,sprier ,sprite ,sprits ,staged ,stalag ,stapes ,static ,stayed ,steady ,steams ,steely ,steeps ,stings ,stipes ,stoics ,stoney ,stoops ,storms ,stoury ,straps ,straws ,stream ,strews ,strict ,strife ,string ,stripe ,strips ,stript ,strobe ,stroma ,strong ,strops ,styler ,styles ,stylet ,sudsed ,sueded ,sugars ,sultan ,sundae ,sunlit ,suntan ,surety ,surger ,surges ,swears ,sweats ,sweets ,taboos ,tahini ,tamers ,tamest ,tangos ,tanned ,tannin ,taoism ,tapers ,tapirs ,tartly ,teamer ,teapot ,teeing ,teemer ,teensy ,teepee ,tended ,tendon ,tenges ,tenths ,tetany ,thirds ,thorns ,thread ,throne ,thrust ,tibiae ,tibias ,tieing ,tilled ,timers ,tinger ,tinges ,tinned ,tiptoe ,tiring ,todays ,toddle ,toeing ,tolled ,tomato ,torpor ,totems ,toting ,towers ,tracer ,traces ,tracts ,tremor ,tribes ,tricot ,trocar ,troops ,tropes ,trusty ,truths ,tryout ,tundra ,turgor ,turned ,tushes ,tweets ,twists ,tyrant ,udders ,ulnars ,undate ,undies ,undoer ,undoes ,unions ,unison ,united ,unless ,unnest ,unread ,unreal ,unreel ,unsaid ,unseal ,unseen ,unsent ,unsure ,untied ,untrod ,untrue ,urgers ,urinal ,usages ,ushers ,waists ,waiter ,warier ,waster ,wastes ,waters ,wearer ,wetter ,wirers ,wirier ,wisest ,witter ,wooers ,worser ,wrasse ,wrests ,wriest ,wrists ,writer ,writes ,yairds ,yearns ,yentas ,yessed ,yirred ,abased ,abated ,abider ,abides ,ablate ,ablest ,aboard ,abodes ,aboral ,abouts ,abrade ,abroad ,abseil ,absent ,abuser ,abuses ,acorns ,action ,acuter ,acutes ,adapts ,addend ,addled ,adepts ,admire ,admits ,adobes ,adopts ,adrift ,adsorb ,adware ,afloat ,afraid ,agenda ,aghast ,aiding ,ailing ,airbed ,airbus ,airgun ,airman ,airmen ,alarms ,albeit ,albite ,alibis ,aligns ,allays ,allege ,alleys ,alloys ,allude ,almost ,aments ,amides ,amidst ,amines ,amoral ,amours ,amuses ,analog ,anemia ,angels ,angina ,angler ,angles ,annoys ,annual ,annuli ,annuls ,answer ,antics ,anting ,anyone ,aplite ,apolar ,aprils ,aprons ,arable ,arbour ,arcade ,arcana ,arcane ,arctan ,argued ,aright ,armada ,armlet ,armour ,arrive ,ascent ,asleep ,aspens ,assume ,atonic ,atrium ,augurs ,august ,autism ,avatar ,averse ,averts ,aviate ,awards ,bairns ,baited ,balers ,balsas ,banter ,barons ,barred ,barrel ,barren ,basalt ,basils ,basins ,basted ,batons ,batted ,batten ,battle ,beanie ,beards ,beaten ,beetle ,beside ,bested ,betide ,biased ,bidets ,biotin ,birder ,birdie ,bitted ,bitten ,blares ,blasts ,bleats ,bloats ,boards ,boated ,bodies ,boiler ,bolter ,bonier ,bonsai ,boosed ,booted ,border ,boreal ,borons ,bosons ,bossed ,boston ,botnet ,bottle ,bouser ,bouses ,braids ,brains ,breads ,breeds ,brides ,brines ,broads ,broils ,broods ,bruise ,brutes ,buries ,burros ,bursae ,bursar ,bursas ,bursts ,busier ,busies ,busses ,buster ,butter ,buttes ,cadets ,cairns ,caners ,canoer ,canoes ,canter ,cantor ,carder ,careen ,carols ,carted ,cartel ,carton ,casein ,casino ,casted ,castle ,cation ,catted ,cattle ,causer ,causes ,ceased ,cedars ,censer ,censor ,center ,centre ,cereal ,ciders ,cirrus ,citron ,citrus ,clears ,cleats ,closer ,closes ,closet ,coated ,coders ,coedit ,coiner ,coitus ,colors ,cooler ,corals ,cornea ,corner ,cornet ,corona ,corral ,cosine ,costal ,cotton ,course ,courts ,cranes ,crated ,craton ,credit ,creeds ,cretin ,crones ,croons ,cruise ,crusts ,curare ,curate ,curers ,curios ,curser ,curses ,cursor ,cusser ,cusses ,cutest ,cutter ,dacite ,dafter ,dahlia ,dainty ,daleth ,danger ,danish ,daring ,dashed ,dating ,deafer ,dearly ,debars ,debase ,debate ,debits ,debris ,debtor ,decare ,decart ,deceit ,decors ,decree ,deeper ,defats ,defeat ,defers ,defier ,defies ,defter ,degust ,deguts ,dehorn ,deicer ,deices ,deisms ,delays ,delude ,demast ,demate ,demies ,demise ,demist ,demits ,demote ,denary ,denned ,denude ,depart ,deport ,depose ,depots ,dermis ,design ,despot ,detect ,dewier ,dewire ,dharna ,dholes ,dialog ,diaper ,diatom ,dicers ,dicier ,dicots ,dilled ,dimers ,dinger ,dinned ,direct ,direly ,disarm ,disbar ,discos ,dished ,dobras ,doctor ,doddle ,dodger ,dodges ,doings ,dolled ,donned ,doomer ,dopers ,dopier ,dormer ,dosing ,doting ,dowers ,dowser ,drafts ,dragon ,dramas ,draper ,drapes ,drawer ,dreams ,dreamt ,dredge ,drifts ,droops ,drowse ,dryads ,dueled ,duller ,earthy ,eclair ,edemas ,edicts ,eeling ,eggars ,eggers ,eggier ,eights ,elapse ,elects ,elicit ,elopes ,eluded ,emails ,emoted ,enacts ,enamor ,encase ,encore ,enemas ,engine ,enrobe ,ensign ,entice ,entrap ,ermine ,erupts ,eskers ,everts ,eyelid ,fainer ,faints ,falser ,falter ,farads ,farout ,fasted ,fasten ,fatted ,fatten ,feared ,fedora ,feeder ,feeler ,filets ,filter ,finest ,finite ,fitted ,flares ,fleets ,fliers ,flirts ,floats ,floors ,floret ,foetal ,foetid ,foetus ,folate ,folios ,footed ,forint ,fossil ,freons ,fronts ,fruits ,furies ,fusser ,fusses ,gaiety ,gained ,galena ,gander ,garage ,garden ,garish ,gasher ,gashes ,gather ,gaunts ,gayest ,geisha ,gelder ,gender ,genial ,genius ,gentle ,geotag ,geyser ,ghetto ,ghosts ,gilder ,girded ,girdle ,girths ,glades ,glared ,gleans ,glider ,glides ,glints ,gluers ,gluier ,gnarls ,goaded ,goanna ,godson ,gonads ,gorges ,gorget ,gourde ,gourds ,graded ,grands ,grassy ,grayer ,greasy ,greyer ,grills ,grinds ,gritty ,gruels ,grunts ,guanos ,guards ,guider ,guides ,guiles ,guilts ,guinea ,gunite ,gunter ,gusted ,gutted ,gyrate ,hailed ,halide ,haloed ,halted ,hander ,harden ,hashes ,hauler ,haunts ,hayers ,headed ,headon ,healed ,hearth ,hearty ,heaths ,heeded ,heeled ,hellos ,hennas ,herald ,herded ,heresy ,hinder ,hinted ,hither ,hogtie ,holder ,holler ,honour ,hooded ,hooray ,horned ,horsey ,housed ,hunter ,hurler ,hurted ,hurtle ,hustle ,hutted ,idioms ,iguana ,incase ,incest ,incise ,incite ,indigo ,infers ,infest ,inhale ,inland ,inlays ,inmate ,inmost ,inrush ,inseam ,insect ,instep ,intact ,ironic ,isopod ,italic ,itself ,kaiser ,karate ,karats ,karsts ,keeked ,kisser ,kisses ,kooked ,labors ,lacers ,lacier ,ladled ,lagoon ,lamest ,landed ,lapses ,lashed ,lastly ,lately ,lathed ,lauded ,layout ,league ,leaper ,ledger ,ledges ,lefter ,leftie ,legion ,lepers ,lethal ,lidded ,lifers ,lifter ,limier ,limits ,linage ,linden ,linger ,lipase ,lisper ,litany ,loafer ,locate ,lodger ,lodges ,logout ,longer ,looney ,losing ,lowers ,lowest ,lusher ,lysine ,mailer ,manats ,manias ,manors ,mantis ,mantra ,marina ,marine ,maroon ,marred ,marten ,martin ,masala ,masons ,massed ,masted ,matron ,matted ,mature ,meaner ,meanie ,meatus ,medias ,melees ,melter ,menses ,mentor ,mesons ,messed ,metals ,mettle ,midair ,miners ,minors ,minter ,missal ,missed ,missus ,misted ,mistle ,misuse ,mitral ,mitred ,mitted ,mitten ,moaner ,moated ,modest ,molars ,molest ,monies ,moored ,mooted ,morale ,morals ,morels ,morons ,morsel ,mortal ,mossed ,motels ,motile ,motion ,mottle ,mouser ,mouses ,mousse ,musers ,muster ,mutate ,mutest ,mutter ,narrow ,nearly ,neatly ,nectar ,nepers ,newest ,nicest ,nieces ,ninety ,ninths ,nitric ,nitwit ,nodded ,nodule ,nonego ,nosily ,nosing ,notice ,noting ,nougat ,nowise ,oblast ,oblate ,obtain ,obtuse ,oceans ,ocelot ,octals ,octane ,octant ,octene ,oddity ,oedema ,oiling ,omelet ,oolong ,opener ,operon ,opines ,opioid ,option ,oracle ,orally ,outfit ,outing ,outlay ,outsaw ,outwit ,ovates ,owlets ,owlier ,owners ,paints ,paired ,palate ,palest ,parade ,parent ,parlor ,parole ,parral ,parsed ,parson ,parted ,passed ,pasted ,pastel ,patent ,patina ,patrol ,patron ,patted ,pauses ,pearls ,pedate ,peeler ,peered ,pelter ,perils ,period ,person ,peruse ,pestle ,petals ,petrel ,petrol ,petted ,pianos ,pilate ,pilots ,pintos ,pistil ,pistol ,piston ,pitied ,pitons ,pitted ,plaits ,plater ,plates ,please ,pleats ,pliers ,points ,poised ,poison ,polars ,polios ,polite ,ponies ,porous ,portal ,ported ,posada ,poseur ,postal ,posted ,poteen ,potent ,potion ,potted ,pottle ,pourer ,pouter ,prated ,preens ,pretan ,prides ,prints ,prions ,prison ,proner ,prosed ,proton ,pterin ,purees ,purest ,purist ,purser ,purses ,pusses ,putter ,racial ,racoon ,rafted ,ragtag ,rakers ,ramrod ,rancor ,ranged ,ransom ,rapids ,rascal ,rasped ,ravers ,readme ,reaker ,really ,realms ,reamed ,reaped ,reasks ,rebels ,rebids ,reboil ,reborn ,rebute ,rebuts ,recane ,recant ,recede ,recent ,recode ,recoil ,recool ,record ,rectal ,recurs ,recuts ,redact ,redeem ,redeny ,redips ,redipt ,redraw ,redrew ,redyed ,reefed ,reeker ,reeves ,refeed ,refile ,refine ,refuse ,refute ,reggae ,regild ,reglue ,rehash ,relace ,relics ,relict ,relief ,remade ,remail ,remain ,remelt ,rename ,renews ,reopen ,repaid ,repeal ,repels ,repent ,repine ,repins ,replot ,repute ,resave ,resawn ,rescan ,rescue ,reseek ,resewn ,resoak ,resown ,resume ,retake ,retook ,revere ,revers ,revert ,revise ,revote ,reward ,rewarn ,reweds ,reword ,ridged ,riding ,rifler ,rifles ,rifted ,rights ,riling ,ringed ,ripens ,risker ,rivers ,rivets ,roamed ,robins ,robust ,roding ,roofed ,rookie ,roomed ,rovers ,rubies ,rumors ,rupees ,rushed ,rustic ,sables ,sabred ,sacral ,sacred ,sadism ,sagger ,salami ,sanely ,sashay ,saucer ,sauces ,savers ,savior ,savors ,scalar ,scaler ,scales ,scared ,scenes ,scents ,sclera ,scones ,scored ,scorns ,scours ,scouts ,screed ,screen ,seabed ,seaman ,seamed ,seamen ,seance ,secant ,secede ,secure ,seeker ,seemed ,seeped ,segued ,select ,selfie ,semens ,sepals ,septal ,sermon ,serums ,server ,serves ,setups ,severe ,severs ,shaded ,shaled ,sheath ,shells ,sherry ,shield ,shills ,shined ,shorty ,shrill ,shroud ,shunts ,shutin ,shyers ,shyest ,siding ,sieves ,sifted ,sigher ,sights ,signal ,signed ,silica ,simian ,simile ,sinews ,singed ,single ,situps ,skater ,skates ,skiers ,skinks ,skirts ,slangs ,sledge ,sleeps ,sleuth ,slicer ,slices ,slimes ,slings ,slogan ,sloops ,sloper ,slopes ,slower ,slurry ,smelts ,smiler ,smiles ,snarfs ,snarly ,sniper ,snipes ,snoops ,snopes ,snouty ,soaker ,soaped ,social ,soften ,solace ,solely ,somoni ,sonics ,sorbed ,source ,sourly ,spader ,spades ,spared ,speeds ,spider ,spines ,spinet ,spiral ,spired ,spited ,splats ,splits ,spoils ,spoilt ,spools ,spoons ,spored ,spouse ,spouts ,sprain ,spread ,sprint ,sprout ,spurts ,stable ,stakes ,stamen ,stance ,staple ,starve ,staves ,steaks ,stevia ,stewed ,stifle ,stilly ,stogey ,stoker ,stokes ,storks ,stoups ,stoves ,stowed ,streak ,strewn ,strike ,strive ,stroke ,strove ,strown ,strums ,strung ,stupas ,stupor ,sturdy ,styled ,stylus ,subsea ,subset ,sudden ,sullen ,sultry ,sunhat ,sunned ,sunray ,supers ,surely ,surfer ,surged ,swines ,swirls ,swoons ,swords ,synods ,tables ,tablet ,tagger ,takers ,tamale ,tangle ,taupes ,tautly ,teamed ,teemed ,termed ,theory ,thirty ,thrall ,thrash ,thresh ,thrill ,tibial ,tidbit ,tidily ,tiding ,tigery ,tights ,tiling ,tinged ,tingle ,tinily ,tocsin ,tonged ,tongue ,tonics ,toning ,toothy ,toplit ,torpid ,tossup ,toupee ,toward ,towels ,traced ,trance ,trashy ,trauma ,trawls ,treble ,trendy ,tribal ,trifle ,trikes ,triple ,tripod ,trivet ,trivia ,troupe ,trover ,trowel ,truces ,trudge ,tubers ,tufter ,tumors ,tunnel ,turbos ,turgid ,tweeds ,twilit ,twiner ,twines ,twirls ,twonie ,uglier ,uglies ,undead ,undine ,undone ,uneasy ,unlaid ,unload ,unroll ,unsold ,untill ,untold ,untune ,unturn ,unused ,uprise ,uproar ,uproot ,upsets ,uremia ,urgent ,utmost ,utopia ,varies ,vaster ,verses ,vetoer ,vetoes ,visits ,visors ,vistas ,voters ,waders ,wailer ,waited ,wanter ,warder ,warner ,warred ,warted ,wasted ,wattle ,weasel ,weeder ,weiner ,weirdo ,wetted ,widest ,wiener ,wilier ,winier ,winter ,witted ,woolie ,worsen ,wursts ,wusses ,yagers ,yahoos ,yarded ,yarned ,yeaned ,yeasty ,yeelin ,yeller ,yields ,yirths ,yodels ,yodler ,yodles ,yogees ,yonder ,aahing ,abhors ,abided ,aboded ,absurd ,abulia ,abused ,achier ,actual ,addict ,adding ,adlibs ,advert ,advise ,afield ,afresh ,agapes ,agaric ,ageing ,agings ,airbag ,airgap ,airway ,alaska ,albedo ,albino ,alight ,alikes ,allows ,alpine ,amends ,amigos ,amnion ,amount ,amulet ,amused ,anally ,anding ,angled ,animal ,animus ,anodic ,antrum ,apiary ,apogee ,archer ,arches ,argyle ,armory ,artful ,ascend ,ashing ,asthma ,attach ,aughts ,avails ,avians ,avoids ,badder ,bailed ,balder ,baleen ,ballet ,ballot ,banana ,bandit ,banner ,barges ,basher ,bashes ,bather ,bathes ,beaded ,beaned ,bedder ,begets ,behest ,beiges ,belles ,belted ,bender ,berths ,besoul ,betray ,bidder ,bigots ,billet ,binder ,birded ,births ,blades ,blared ,bleeds ,bloods ,blouse ,bluest ,bluets ,blurts ,bodied ,bogies ,boiled ,bolder ,bolted ,bonnet ,bonnie ,boodle ,boogie ,boohoo ,booths ,borage ,bother ,boused ,brands ,brassy ,bratty ,brayer ,breath ,bridal ,bridle ,briery ,broths ,brutal ,bureau ,burial ,buried ,burler ,burner ,burnet ,burred ,bursal ,burton ,busied ,bussed ,busted ,bustle ,butane ,butene ,butler ,butted ,button ,caddie ,cagier ,cahoot ,callas ,caller ,canals ,canard ,candor ,canine ,cannot ,canoed ,canola ,canons ,canted ,cantle ,canton ,carded ,cargos ,carnal ,cashes ,casual ,causal ,caused ,cellar ,cellos ,census ,chairs ,chaise ,charts ,chaser ,chases ,chaste ,cheats ,cheers ,cheese ,cherts ,chests ,choirs ,choose ,chorea ,chores ,cigars ,cinder ,clades ,clause ,cleans ,client ,clones ,closed ,clouts ,coaled ,codons ,coheir ,cohere ,cohort ,coiled ,coined ,colder ,coleus ,collar ,collie ,colons ,colour ,condor ,condos ,consol ,cooled ,corded ,cordon ,corned ,coulee ,counts ,cousin ,coyest ,coyote ,cradle ,craned ,creasy ,cressy ,cruder ,cruels ,curler ,cursed ,cussed ,cutins ,cutlet ,cutout ,cuttle ,dacron ,daemon ,dagger ,damsel ,dancer ,dances ,dangle ,darker ,dative ,datums ,dauber ,daubes ,davits ,deacon ,deadly ,deafen ,deathy ,deaves ,debone ,deburr ,debuts ,decade ,decals ,decane ,decant ,decene ,decent ,decern ,decide ,decile ,decode ,deemed ,deepen ,defied ,defile ,define ,deflea ,defuse ,degage ,deiced ,delfts ,delict ,delime ,deluge ,demean ,dement ,demoed ,demons ,demure ,demurs ,dengue ,denims ,depone ,depute ,derive ,dermal ,desman ,desmid ,deuces ,devest ,devise ,devoir ,devote ,dewans ,dewool ,diacid ,diadem ,digger ,dinged ,dining ,dipole ,discus ,dismal ,disown ,dispel ,divers ,divert ,divest ,divots ,doable ,docile ,dodged ,dogtag ,doling ,domain ,domino ,doomed ,doubts ,dowels ,downer ,dowsed ,drakes ,draped ,drawls ,driver ,drives ,drolly ,droves ,drowns ,drudge ,dryish ,dugout ,dulled ,dupers ,during ,earbud ,earful ,earwig ,echoes ,edible ,egoism ,eloped ,emerge ,enable ,enamel ,encode ,ending ,endows ,energy ,enfant ,engage ,enolic ,envier ,envies ,eschar ,escudo ,etcher ,etches ,ethics ,ethyne ,eureka ,evader ,evades ,evener ,events ,eviler ,eyeing ,fadein ,failed ,faiths ,faller ,fanout ,fardel ,faroff ,father ,faults ,faunas ,feisty ,feline ,fellas ,feller ,felons ,felted ,fender ,fetish ,fields ,fiends ,filial ,filler ,fillet ,finale ,finals ,finder ,finial ,fisher ,fishes ,flails ,flared ,flints ,floods ,floral ,florin ,flours ,flouts ,flutes ,foaled ,fodder ,fogies ,foiled ,folder ,fonder ,fooled ,footsy ,forage ,forays ,forego ,forger ,forges ,forget ,forgot ,fouler ,foyers ,frauds ,friary ,friend ,frills ,fronds ,frosty ,froths ,fryers ,fueler ,furred ,fusion ,fussed ,futile ,futons ,future ,gadget ,gallon ,galosh ,gamers ,gamest ,gamete ,gamier ,gargle ,gashed ,gasper ,gastly ,gating ,gauges ,gelded ,gelled ,gentry ,gilded ,ginger ,ginned ,glands ,glassy ,gleety ,glided ,glossy ,gluons ,gluten ,gnatty ,gofers ,goings ,golden ,goober ,google ,googol ,gorged ,gorily ,goring ,gossip ,gouger ,gouges ,graces ,grafts ,grainy ,grapes ,grasps ,grayed ,greedy ,greyed ,griefs ,grimes ,griper ,gripes ,grisly ,grocer ,gromet ,grooms ,groper ,gropes ,ground ,grower ,guided ,guilds ,guiled ,gullet ,gunner ,gusher ,gushes ,habits ,handed ,handle ,hangar ,hanger ,harbor ,harems ,harmer ,harper ,harrow ,hashed ,hating ,hauled ,hawser ,hawses ,health ,hedger ,hedges ,hefter ,heifer ,henrys ,herber ,hereof ,hermit ,heroic ,herpes ,hewers ,hidden ,hilled ,hinges ,hiring ,hoeing ,holden ,homers ,homier ,honeys ,hoofer ,hosing ,hotdog ,hotpot ,hounds ,hugest ,huller ,hunted ,hurdle ,hurled ,hurrah ,hushes ,hyaena ,hydras ,hyenas ,iceage ,idling ,idylls ,imager ,images ,imagos ,inborn ,inbred ,incant ,incurs ,indict ,infant ,infuse ,inkier ,inlaws ,inning ,inputs ,intake ,invert ,invest ,invite ,inward ,ireful ,itches ,katals ,kayaks ,keener ,ketone ,kettle ,khakis ,kilter ,kinase ,kinked ,kirtle ,kissed ,kitten ,kittle ,koalas ,koodoo ,kronas ,krones ,kroons ,labels ,labial ,labile ,labour ,lading ,lagger ,lakers ,lament ,lamina ,lancer ,lances ,lancet ,langue ,langur ,lanugo ,lapels ,lapsed ,larvae ,larvas ,latkes ,layery ,leafed ,leaker ,leanly ,leaped ,leaver ,leaves ,lectin ,ledged ,legend ,lemons ,lemurs ,leptin ,lepton ,levees ,levers ,levier ,levies ,lewder ,liable ,libels ,libido ,lifted ,ligand ,lights ,lignin ,likest ,lilacs ,lingua ,lining ,lipids ,lisbon ,lisped ,litmus ,livers ,llamas ,loafed ,loaves ,locale ,locals ,locust ,lodged ,lofted ,logger ,lonely ,longed ,looker ,loomed ,looped ,lordly ,lounge ,lovers ,lowlit ,lucite ,lulled ,lunary ,lunges ,luring ,madder ,maiden ,mailed ,mallet ,malted ,manila ,manner ,mantel ,mantle ,manure ,maraud ,marlin ,martyr ,masher ,mashes ,mateys ,mauler ,mayors ,meager ,meagre ,medals ,medial ,median ,medius ,melons ,melted ,mender ,menial ,mental ,merger ,merges ,mesher ,meshes ,milder ,milieu ,miller ,millet ,mindat ,minder ,minion ,minted ,minuet ,minute ,mirage ,misadd ,misery ,misled ,moaned ,modals ,models ,modern ,mohair ,molted ,molten ,mommas ,mooned ,morays ,morula ,mother ,moults ,mounts ,mourns ,moused ,muesli ,murals ,murder ,murine ,mussel ,mutant ,mutton ,myotis ,nagger ,naiver ,native ,navies ,neaped ,neighs ,nerves ,newels ,newton ,niacin ,nights ,nobler ,nobles ,nomads ,nondog ,nonfat ,nonfee ,nonfit ,nongod ,nonyne ,nordic ,normal ,normed ,nudges ,nudity ,nylons ,oafish ,ochers ,ochres ,ocular ,oeuvre ,oilcan ,oilman ,oilmen ,olives ,omegas ,onward ,oocyst ,oocyte ,oohing ,oology ,ootype ,opened ,opined ,osprey ,ossify ,ounces ,outbid ,outgun ,outlaw ,output ,ovated ,overdo ,ovoids ,padder ,paella ,pagers ,pained ,pallet ,pallor ,pandas ,pander ,panels ,panted ,pardon ,pariah ,parish ,parity ,pastry ,pathos ,paused ,payees ,payers ,pealed ,peanut ,pedals ,pedant ,peeled ,pellet ,pelted ,penile ,penner ,pepper ,perish ,phases ,photos ,phrase ,pillar ,pineal ,pinion ,plaids ,plains ,planar ,planer ,planes ,planet ,plants ,plated ,pleads ,pleura ,pliant ,pluses ,poetry ,ponder ,poodle ,pooled ,popper ,posher ,potage ,potash ,pother ,poults ,poured ,pouted ,prayer ,pretty ,prided ,priory ,prissy ,prudes ,pruner ,prunes ,pulsar ,pulser ,pulses ,punier ,punter ,pureed ,purine ,purred ,pursed ,pursue ,putrid ,putted ,pyrite ,rachet ,radium ,ragged ,raging ,ragtop ,rancid ,random ,ranker ,rarefy ,rarify ,rashly ,ratify ,ravels ,ravens ,ravine ,raying ,reaked ,rebill ,rebind ,rebond ,recall ,redubs ,reduce ,reecho ,reeked ,refill ,refind ,refold ,refuel ,regime ,regrew ,regrip ,regrow ,rehabs ,rehang ,rehems ,rehome ,reinks ,reknit ,reknot ,relive ,relook ,remand ,remend ,remind ,remold ,renown ,repays ,repegs ,replan ,repoll ,reship ,reshow ,rethaw ,retype ,reveal ,revels ,revile ,revolt ,revues ,rewash ,reweld ,rewind ,ribeye ,richer ,riches ,rifled ,rigged ,rinker ,risked ,rivals ,rooked ,roughs ,rubied ,rubles ,rubout ,rudely ,rufous ,rugger ,ruling ,rumour ,sabled ,sachet ,safety ,sagely ,sagged ,saliva ,sallow ,salmon ,salver ,salves ,salvia ,sauced ,savant ,savour ,saying ,scalds ,scaled ,scarey ,scarry ,scathe ,scatty ,schist ,scolds ,scrags ,scroll ,search ,seaway ,second ,seduce ,sedums ,seldom ,selves ,sepoys ,seraph ,serval ,served ,sevens ,sewage ,shafts ,shaley ,shames ,shanty ,shaper ,shapes ,sharps ,sheafs ,sheeps ,sherif ,sherpa ,shifts ,shinty ,shmear ,shmoes ,shoaly ,should ,shouty ,shower ,shrews ,shrugs ,sieved ,sighed ,sigmas ,silver ,sinker ,siskin ,skated ,skirls ,skulks ,skunks ,slalom ,slaves ,sleave ,sleeks ,sleeve ,sleigh ,slewed ,sliced ,slight ,slimed ,sliver ,sloped ,sloshy ,slowed ,sludge ,sluice ,slurps ,smalls ,smarty ,smeary ,smells ,smiled ,smiths ,smooth ,snafus ,snakes ,snarks ,sneaks ,sniped ,snowed ,soaked ,sodium ,sogged ,solemn ,solver ,solves ,sought ,souped ,spaded ,sparry ,spells ,spends ,sphere ,spigot ,spills ,spinal ,spined ,spinel ,spleen ,spline ,splint ,sporty ,spotty ,sprays ,sprigs ,spryer ,spurns ,staked ,stalks ,starch ,staved ,steamy ,stigma ,stingy ,stinks ,stitch ,stodgy ,stoked ,stormy ,strawy ,stripy ,stupid ,stymie ,suaver ,sublet ,subnet ,suborn ,subtle ,sugary ,sunday ,sundog ,sundry ,supine ,surfed ,svelte ,swathe ,swaths ,swayer ,sweaty ,swells ,swills ,swoosh ,system ,tabled ,tagged ,talker ,talkie ,tallow ,tandem ,tanker ,tasked ,taught ,tavern ,teabag ,techie ,tedium ,teflon ,tenpin ,tephra ,thefts ,theism ,themes ,therms ,things ,thongs ,thorny ,thrice ,thrift ,thrips ,throbs ,throng ,throws ,thrush ,thwart ,tiddly ,tinker ,tinman ,tinmen ,toggle ,tokens ,toucan ,toughs ,towage ,towery ,toying ,tragic ,travel ,trough ,trying ,tufted ,tugger ,tulips ,tumour ,tunics ,tuning ,tuples ,turban ,turbid ,turfed ,turnip ,tusker ,twills ,twined ,twisty ,typist ,ulcers ,unaged ,unarms ,unbars ,unbear ,unbias ,uncase ,unfair ,unfits ,unfree ,unhurt ,unlash ,unripe ,unrobe ,unsafe ,unshod ,unstep ,unstop ,untidy ,untrap ,unwire ,unwise ,update ,upside ,uracil ,urbane ,urning ,uropod ,usable ,usurps ,vainer ,valets ,varied ,vassal ,vatted ,veared ,veered ,veiler ,veneer ,venter ,versed ,versus ,vessel ,vestal ,vested ,vetoed ,vetted ,videos ,vilest ,violas ,violet ,virile ,virion ,virtue ,vision ,vitals ,voider ,voodoo ,wadder ,wagers ,wailed ,wallet ,walrus ,wander ,wanted ,wanton ,warded ,warden ,warned ,washer ,washes ,watery ,weaned ,weeded ,weened ,welder ,wheats ,wheres ,whirrs ,whiter ,whites ,widens ,wields ,wilder ,wilted ,winder ,winner ,wisher ,wishes ,wither ,woaded ,wonder ,wonted ,wonton ,wooded ,wooden ,wooled ,woolen ,worded ,worlds ,worths ,wraith ,wraths ,wreath ,writhe ,wryest ,yarely ,yarrow ,yearly ,yelled ,yenned ,yerbas ,yodled ,yogini ,yogins ,yogurt ,youths ,yowies ,yttric ,yulans ,abbess ,abbots ,abound ,absorb ,acacia ,access ,accost ,acetic ,acetyl ,acting ,acuity ,adduce ,adduct ,advent ,affair ,agleam ,aidful ,aiming ,alephs ,alkali ,alkane ,alkene ,alleve ,allium ,almond ,alphas ,alumna ,alumni ,always ,ambers ,ambits ,amebae ,amebas ,amerce ,amoeba ,ampere ,anchor ,ankles ,anklet ,anthem ,anvils ,aphids ,apices ,apiece ,appear ,appose ,arched ,arcing ,arctic ,arming ,armpit ,aspect ,aspics ,atomic ,atopic ,auburn ,augury ,aurify ,autumn ,avenue ,aviary ,aweing ,awhile ,awhirl ,baaing ,babble ,babier ,babies ,badger ,badges ,bagels ,bailey ,ballad ,balled ,banded ,banger ,banish ,banned ,barber ,barbie ,barely ,barged ,baring ,barley ,barney ,barony ,barrow ,basely ,bashed ,basics ,basing ,bathed ,bating ,bayous ,beagle ,beauty ,bedded ,beeper ,befits ,before ,begins ,begone ,behead ,beings ,belaud ,belays ,belled ,bemire ,bended ,bereft ,beryls ,beseem ,bestow ,beware ,bidden ,bilges ,billed ,binary ,binded ,binger ,binges ,binned ,biomes ,biotic ,bisect ,biting ,bladed ,bleary ,blends ,blinds ,blithe ,blonde ,blonds ,blotty ,blunts ,bobbed ,bobbin ,bobble ,bonded ,bongos ,booboo ,booing ,boomer ,boring ,borrow ,bosoms ,botany ,bottom ,bougie ,bounds ,bowers ,bracer ,braces ,brainy ,brayed ,brewer ,briber ,bribes ,bridge ,briefs ,briney ,brings ,brogan ,brogue ,broody ,brooms ,browse ,builds ,bullae ,bullet ,bunion ,bunted ,burden ,burger ,burled ,burned ,bushes ,buyers ,byroad ,cacaos ,called ,callus ,cameos ,camera ,canary ,candid ,candle ,canned ,cannon ,capers ,capite ,captor ,caract ,carafe ,caring ,carobs ,carper ,carpet ,cashed ,casing ,catgut ,caudal ,celery ,celled ,chains ,chalet ,chants ,chards ,chased ,chides ,chinas ,chiral ,chisel ,chitin ,choral ,chords ,chored ,chorus ,chosen ,chutes ,citing ,citric ,classy ,clonal ,cloned ,clothe ,cloths ,clouds ,cobras ,coccus ,cocoas ,codded ,coddle ,codger ,coerce ,cogent ,comers ,comets ,conned ,consul ,cooing ,copier ,copies ,copses ,copter ,coring ,corpse ,cosign ,cosily ,cosmos ,costly ,cougar ,cowers ,crafts ,crayon ,creams ,creeps ,crepes ,crimes ,cringe ,crisps ,critic ,crofts ,crusty ,cultus ,curded ,curdle ,curled ,curtsy ,cutesy ,cuteys ,damage ,damned ,danced ,danker ,darken ,daubed ,dawdle ,dawned ,deaved ,debuds ,decays ,decoys ,deduce ,deduct ,defend ,defogs ,defrag ,defray ,defuel ,degerm ,deinks ,delver ,delves ,demand ,depend ,depths ,descry ,detach ,detusk ,deuced ,devein ,devels ,devils ,devoid ,devour ,devout ,dharma ,dialup ,digged ,dinker ,dirham ,dismay ,divide ,divine ,dogday ,dogged ,dogleg ,dogmas ,dollop ,dolmen ,double ,doughs ,dowery ,downed ,drafty ,dreamy ,drinks ,drivel ,driven ,droopy ,dropsy ,drowsy ,drying ,dually ,ductal ,ducted ,dunces ,dunged ,dustup ,duvets ,dwells ,dyeing ,echoed ,edgily ,edging ,effort ,eighth ,eighty ,eleven ,elfish ,embers ,emboss ,emcees ,emetic ,empire ,encyst ,endive ,enfold ,enigma ,enlive ,enmesh ,enmity ,enough ,enrich ,envied ,epilog ,epimer ,escape ,escrow ,etched ,ethnic ,eulogy ,evaded ,evened ,facets ,facies ,factor ,faeces ,fairly ,fallen ,fanned ,farces ,faring ,farmer ,fascia ,fatwas ,faunal ,fealty ,feigns ,felled ,fended ,fennel ,ferric ,feudal ,feuded ,fewest ,fiasco ,fibers ,fibres ,fiddle ,fidget ,fierce ,figure ,filled ,finery ,finger ,finish ,finned ,firing ,firmer ,fished ,flaunt ,flayer ,flirty ,floaty ,flossy ,fluent ,fluids ,fluted ,flyers ,foamer ,folded ,fonded ,fondle ,fondue ,forcer ,forces ,forged ,format ,former ,fouled ,founds ,fourth ,fracas ,framer ,frames ,frayed ,freely ,fresco ,friday ,fridge ,frigid ,fringe ,fruity ,fueled ,fuller ,funder ,funner ,gabler ,gables ,gaelic ,gagger ,gainly ,galley ,ganefs ,ganged ,ganofs ,garbed ,garble ,garlic ,gasket ,gasped ,gauged ,gayety ,genome ,gently ,geodic ,gerbil ,ghouls ,giblet ,gifted ,givers ,glamor ,gleams ,glioma ,gloams ,globes ,glooms ,glower ,gnarly ,gnawer ,gnomes ,goblet ,golfer ,gonifs ,gonofs ,goofed ,gospel ,gouged ,graced ,granny ,graver ,graves ,grieve ,grimed ,griped ,groove ,groped ,groups ,grover ,groves ,growed ,growls ,grudge ,grunge ,guilty ,gulags ,gulden ,gulled ,gunned ,gurgle ,gurney ,gushed ,haggis ,hamlet ,hanged ,hardly ,harlem ,harmed ,harped ,hatpin ,hauyne ,heaped ,heathy ,heaver ,heaves ,hedged ,hefted ,height ,helmet ,helper ,herbal ,herbed ,hiding ,higher ,hikers ,hinged ,hitman ,hitmen ,hogger ,holing ,holism ,honing ,hoofed ,hooker ,hooped ,hoover ,hooves ,hotbed ,hottub ,hourly ,hovers ,howard ,howler ,hubris ,huddle ,hulled ,humite ,humors ,hunger ,hushed ,hyalin ,icings ,idiocy ,illium ,illume ,imaged ,impair ,impart ,import ,impose ,incher ,inches ,indium ,induce ,induct ,infill ,infold ,invade ,invent ,itched ,kaolin ,kasher ,keeled ,keened ,keloid ,kerned ,kernel ,kicker ,kidder ,kiddie ,kiddos ,killer ,kilted ,kinder ,kneads ,kneels ,koruna ,kosher ,lacuna ,lagged ,lanced ,lanker ,larked ,larval ,laughs ,lawned ,lawyer ,laying ,leaked ,leaved ,leaven ,lecher ,leches ,leeway ,legged ,length ,leveed ,levels ,levied ,likens ,limned ,lineup ,linker ,lithic ,livens ,lobule ,locule ,loculi ,logged ,logics ,loofah ,looked ,loudly ,louver ,louvre ,lucent ,lugger ,lumens ,lunged ,lupine ,lupins ,lurker ,luteum ,lyrics ,macros ,madden ,mafias ,magnet ,maimer ,mammal ,mammon ,manage ,manger ,mangos ,manned ,manual ,maraca ,margin ,marmot ,marrow ,mascot ,mashed ,massif ,mastic ,mating ,mauled ,measly ,meddle ,melded ,memoir ,menage ,mended ,meotic ,meower ,mercer ,merely ,merged ,mering ,meshed ,method ,metric ,midden ,middle ,midges ,midget ,milled ,mimosa ,minded ,miring ,misaim ,misfit ,mislay ,modded ,modula ,module ,moduli ,modulo ,molded ,moneys ,monger ,months ,mooing ,mopers ,morgue ,morrow ,mosaic ,mostly ,motifs ,motley ,moulds ,moulin ,mounds ,mousey ,mouths ,mowers ,muller ,mullet ,murray ,musher ,mushes ,muslin ,mutual ,myosin ,myriad ,myrtle ,nachos ,nagged ,naught ,navels ,nearby ,nebula ,nerved ,newish ,nicety ,niches ,nobled ,noggin ,noncut ,nonegg ,nonfed ,nongay ,nonlab ,notify ,nought ,novels ,noways ,nuance ,nuclei ,nudged ,nudism ,nugget ,obeyed ,oblige ,octopi ,octyne ,offers ,offset ,ogling ,oinked ,oneway ,oppose ,optics ,opting ,orchid ,orphan ,outcry ,ovular ,ovules ,owlery ,owlish ,paanga ,pacers ,padded ,paddle ,pagans ,pagoda ,palled ,pallid ,paltry ,panned ,pantry ,papers ,paring ,parlay ,parley ,parody ,parsec ,partly ,pataca ,payola ,payout ,peaces ,pearly ,peddle ,peeper ,peewee ,pended ,penned ,pepped ,permit ,pertly ,pewees ,pewits ,pewter ,phased ,phones ,photon ,piddle ,pieces ,pieing ,pierce ,pigeon ,piglet ,pigout ,pingos ,pinned ,pipers ,pipits ,pippin ,planed ,plasty ,player ,plural ,pluton ,podded ,poetic ,pointy ,polish ,polled ,pollen ,poofer ,poohed ,pooper ,poorly ,popest ,popped ,poring ,portly ,poshed ,posing ,postop ,potpie ,pounds ,powers ,prayed ,prearm ,predry ,prefer ,prefit ,premet ,prewar ,preyed ,pricer ,prices ,primer ,primes ,prisms ,prober ,probes ,profit ,prolog ,promos ,prongs ,proofs ,proper ,pruned ,puller ,pullet ,pulsed ,pundit ,punner ,punted ,puppet ,purger ,purges ,purity ,pusher ,pushes ,pylori ,pyrene ,pyuria ,rabbet ,rabbis ,rabbit ,raceme ,racily ,racing ,racism ,raffia ,rakish ,rammer ,ranked ,raping ,rapper ,raptly ,ravage ,ravish ,reblog ,rebury ,rebuys ,recaps ,recipe ,redefy ,redink ,reface ,reflag ,reform ,refuge ,refund ,regive ,reglow ,rehook ,rehung ,rekeys ,relink ,remaps ,remedy ,repace ,replay ,revery ,rewarm ,rewipe ,rewrap ,ribber ,ricing ,righty ,riming ,rinked ,ripely ,ripper ,robber ,robing ,rococo ,romper ,ropily ,roping ,rowing ,rueful ,rugged ,rupiah ,safely ,salved ,sambar ,sambas ,sapper ,savage ,savory ,sawing ,scanty ,scapes ,scarab ,scarce ,scarfs ,scarps ,school ,scoops ,scopes ,scrape ,scraps ,scream ,screws ,scribe ,script ,sculls ,scurry ,seccos ,seemly ,septic ,sewing ,shadow ,shaker ,shakes ,shaman ,shamed ,shaped ,sharks ,shaver ,shaves ,shawls ,shelly ,shirks ,shiver ,shoddy ,shogun ,shooks ,shover ,shoves ,showed ,shrewd ,shriek ,shrive ,shrubs ,silken ,silvan ,simmer ,simper ,sinewy ,sinful ,singly ,siphon ,sipper ,sitcom ,skills ,slangy ,slaved ,sleepy ,slinks ,slough ,sloven ,slushy ,smarms ,smiley ,snaked ,snatch ,snitch ,snivel ,snoopy ,sobber ,soccer ,sodomy ,soffit ,softly ,solved ,somber ,sombre ,sorbic ,sowing ,spacer ,spaces ,spasms ,spayed ,specie ,speedy ,sperms ,spewer ,sphene ,spicer ,spices ,splash ,splays ,splosh ,sponge ,spoofs ,sporic ,sprang ,spring ,spurge ,spurry ,stably ,staffs ,stamps ,stanch ,stench ,steppe ,stiffs ,stomps ,subdue ,sulcus ,sulfur ,sulker ,sunbed ,sunups ,swamis ,swarms ,swayed ,sweeps ,swifts ,swings ,swiper ,swipes ,swirly ,swoops ,syrups ,tactic ,talked ,talmud ,tamely ,taming ,tamper ,tanked ,taping ,tapper ,tariff ,tarmac ,tawney ,temper ,tempos ,tempts ,thawed ,themed ,thence ,thieve ,thighs ,thinly ,thrive ,thrown ,thrums ,thusly ,tictac ,tictoc ,timber ,timbre ,timely ,timing ,tinful ,tingly ,tipper ,tiptop ,toecap ,toffee ,tomcat ,topics ,topper ,toprim ,touche ,towing ,tramps ,trebly ,trench ,trimly ,triply ,tropic ,trunks ,tubule ,tugged ,tumult ,tuneup ,tusked ,twangs ,tweedy ,twenty ,twerps ,twinge ,twirly ,twirps ,twofer ,tycoon ,umlaut ,unable ,unawed ,unbelt ,unbent ,unbolt ,unborn ,uncles ,uncoil ,uncool ,undeep ,undyed ,unfelt ,unglue ,ungual ,unhand ,unlace ,unmade ,unmans ,unopen ,unpaid ,unpens ,unpent ,unpins ,unpure ,unruly ,unsnap ,unsown ,unsung ,unworn ,upends ,upload ,upshot ,upturn ,urging ,useful ,valour ,valuer ,values ,vaults ,veiled ,veined ,velour ,vendor ,venial ,venous ,vented ,venues ,verges ,verity ,vernal ,vestry ,villas ,violin ,visage ,visual ,voided ,votary ,wadded ,waddle ,wafers ,wafter ,waftes ,wagons ,walled ,walnut ,warily ,warmer ,warper ,wasabi ,washed ,wayout ,wealth ,webers ,wedded ,wedges ,weensy ,weeper ,welded ,welled ,wended ,whaler ,whales ,wheels ,whilst ,whiner ,whines ,whirls ,whited ,whiten ,wholes ,whorls ,widget ,widths ,wiglet ,wilded ,willed ,winded ,winery ,winger ,wintry ,wipers ,wirily ,wiring ,wisely ,wished ,within ,woodsy ,woofer ,wooing ,wormer ,wounds ,wrings ,wrongs ,yakked ,yamens ,yapons ,yauper ,yawner ,yelper ,yeoman ,yeomen ,yorker ,youngs ,yowler ,abacus ,abloom ,ablush ,abrupt ,accede ,accent ,accord ,accrue ,accuse ,acidic ,acidly ,acinic ,active ,affine ,afford ,aflame ,agogic ,alpaca ,ambler ,ambles ,ammine ,ampler ,anemic ,ankled ,apathy ,apeman ,apemen ,apical ,appeal ,appels ,apples ,applet ,asking ,asylum ,ataxia ,attack ,avenge ,avower ,awakes ,aweigh ,awning ,axises ,babied ,baboon ,badged ,bagger ,baggie ,bakers ,balboa ,baling ,balsam ,banged ,bangle ,barbed ,barbel ,bardic ,barfed ,barium ,barker ,barman ,barmen ,basket ,batiks ,beacon ,beaker ,beamed ,beatup ,beaver ,beefed ,beeped ,befool ,beggar ,beheld ,behind ,behold ,belief ,belong ,belows ,beluga ,bemoan ,bemuse ,bengal ,benign ,besmut ,betake ,bevies ,beyond ,bibles ,biding ,bigger ,bikers ,bilged ,binged ,bionic ,bipeds ,bipods ,blamer ,blames ,bleeps ,bloody ,blooms ,blousy ,blower ,bluesy ,bluish ,blurry ,bodice ,bodily ,boding ,bogeys ,boning ,boobed ,booker ,boomed ,bounty ,bowels ,bowler ,boyish ,braced ,brakes ,brandy ,brashy ,braver ,braves ,bravos ,brawls ,brawns ,breaks ,breves ,brevet ,brewed ,bribed ,bright ,broker ,bronco ,broncs ,brooks ,brothy ,browed ,browns ,bubble ,buboes ,budded ,budges ,budget ,budgie ,bugler ,bugles ,bulges ,bulled ,bundle ,bungee ,buoyed ,burgle ,burrow ,bushed ,bushel ,busily ,busing ,butyne ,buyout ,byline ,cabala ,cabals ,cabins ,cables ,cactus ,caecal ,caftan ,caiman ,cakier ,calces ,calico ,calmer ,camels ,canape ,cancer ,caning ,canyon ,caplet ,capsid ,carbon ,carmen ,carpal ,carped ,carpel ,carpus ,carver ,carves ,casket ,catnap ,catnip ,catsup ,caveat ,cavers ,caviar ,cavort ,ceding ,celiac ,celtic ,cement ,cerium ,cesium ,charge ,chatty ,cheery ,cheesy ,cherry ,cherty ,chesty ,chided ,childs ,chilli ,chills ,choosy ,churls ,churns ,cicada ,cicala ,cinema ,circle ,circus ,civets ,claims ,clamor ,clangs ,clasps ,clefts ,cleome ,cleric ,climes ,clings ,cloaca ,cobalt ,cocoon ,coding ,coelom ,cohosh ,colony ,comedo ,confer ,conics ,coning ,cooker ,cookie ,coolly ,cooped ,coowns ,copied ,copout ,corker ,corpus ,county ,coupes ,covers ,covert ,covets ,coward ,craver ,craves ,crawls ,creaks ,creeks ,crewed ,crewel ,croaks ,crocus ,crooks ,crowds ,crowed ,crowns ,cubist ,cubits ,cuddle ,culled ,curing ,curtly ,custom ,cutely ,dabber ,dactyl ,daftly ,damper ,dangly ,dapper ,daybed ,deafly ,debugs ,decoct ,decury ,decyne ,deeply ,deface ,defame ,defang ,defect ,defoam ,deform ,deftly ,defund ,degums ,deific ,delink ,delphi ,delved ,demobs ,depict ,deploy ,deputy ,dermic ,dewily ,deworm ,dibber ,dicing ,differ ,dimmer ,dipper ,dognap ,doming ,doping ,dotcom ,douche ,dovish ,drably ,draggy ,dreggy ,drench ,drunks ,dwarfs ,dweebs ,dyadic ,dynamo ,echoey ,edemic ,effuse ,egging ,eggnog ,elbows ,elvish ,embeds ,emboli ,emceed ,entomb ,envoys ,enwrap ,erbium ,euonym ,evicts ,exerts ,exists ,extort ,extras ,eyeful ,fables ,facade ,facial ,fading ,faecal ,fakers ,famine ,famous ,fanged ,farmed ,faucet ,faulty ,favors ,fawner ,feeble ,felony ,felsic ,female ,femurs ,fencer ,fences ,fervor ,fescue ,fevers ,fiance ,fibred ,fibril ,fibrin ,fights ,filing ,finely ,fining ,firmed ,fiscal ,fivers ,flames ,flange ,flatly ,flayed ,fledge ,fleece ,flings ,flinty ,floury ,flower ,fluffs ,flurry ,foamed ,foible ,foment ,forbid ,forced ,forker ,formal ,formed ,formin ,forums ,fowler ,framed ,francs ,freaks ,fright ,frilly ,frisks ,frolic ,frothy ,frowns ,frugal ,fuddle ,fudges ,fugues ,fumier ,funded ,funnel ,furrow ,fusing ,gabled ,gagged ,gaggle ,gaging ,gallop ,gallow ,ganevs ,gasify ,gavels ,geeked ,gigged ,giggle ,givens ,gladly ,glance ,gleeks ,global ,globed ,glover ,gloves ,glowed ,gluing ,gnawed ,gnomon ,goblin ,goggle ,googly ,gopher ,gotcha ,gothic ,govern ,gowned ,graham ,granum ,graphs ,graved ,gravel ,graven ,gravid ,groved ,grovel ,growth ,guavas ,gulley ,gulper ,gundog ,hagged ,haggle ,haitch ,hallow ,halver ,halves ,hanker ,hankie ,hardup ,harked ,harken ,hatful ,havens ,haying ,heaved ,heaven ,heehaw ,helium ,helmed ,helped ,hereby ,heyday ,hoeful ,hogged ,hollow ,homage ,honker ,hooked ,hooved ,hooven ,hovels ,howled ,hugger ,humane ,humans ,humour ,humous ,husker ,huskie ,hybris ,icedam ,iceman ,icemen ,icicle ,ickier ,iconic ,imbeds ,impala ,impale ,impede ,impels ,impure ,inched ,income ,infect ,infirm ,inform ,karmas ,keeper ,kennel ,kicked ,kidded ,killed ,kilned ,kindle ,kiting ,knacks ,knells ,knocks ,knolls ,knotty ,lacily ,lacing ,lactic ,lamely ,lapdog ,laptop ,lavage ,lavish ,layman ,laymen ,layups ,legman ,legmen ,legume ,lemony ,levity ,lichen ,limber ,liming ,limper ,limpet ,linked ,lipoma ,livery ,lobber ,lobing ,loping ,lopper ,lovage ,lowfat ,lugged ,lurked ,lushly ,madame ,madams ,maggot ,maimed ,mainly ,makers ,malady ,malice ,malign ,mangle ,maniac ,manics ,maples ,marble ,markas ,marker ,market ,marshy ,masker ,meadow ,meanly ,medics ,medley ,meeker ,melody ,menace ,meowed ,merman ,mermen ,micron ,midday ,midgut ,midrib ,mincer ,minces ,mingle ,minima ,minimi ,minims ,mining ,minyan ,miscue ,miscut ,mobile ,modems ,moguls ,moment ,monday ,mongol ,monism ,mopeds ,morbid ,motive ,movers ,movies ,mucosa ,muddle ,mulish ,mulled ,mushed ,musics ,musing ,mutely ,muting ,mutiny ,mutism ,myelin ,mythos ,nabobs ,namely ,naming ,napper ,netcom ,newbie ,nicely ,nipper ,nobody ,nonmud ,nutmeg ,oblong ,occurs ,octave ,okayed ,oogamy ,opcode ,openly ,opiums ,osmium ,overly ,owling ,owning ,oxters ,palace ,palely ,palmar ,panics ,parcel ,parkas ,parker ,pascal ,pauper ,pecans ,pectin ,peeped ,peever ,peeves ,pentyl ,penury ,people ,pepsin ,permed ,phenol ,phoned ,phooey ,pieced ,pigsty ,pikers ,pilafs ,pilfer ,piling ,pincer ,pinged ,pining ,pinyin ,pinyon ,pitman ,pitmen ,pivots ,placer ,places ,plague ,plasma ,played ,pledge ,plenty ,plinth ,plower ,pokers ,pokier ,police ,poling ,pomade ,pomelo ,poofed ,pooped ,poplar ,porker ,possum ,potman ,potmen ,powder ,prance ,prawns ,precut ,premed ,preppy ,priced ,primal ,primed ,prince ,probed ,propel ,prover ,proves ,prowls ,psalms ,puddle ,pulled ,punish ,punned ,pupate ,pupped ,purely ,purged ,purism ,pushed ,pylons ,rabble ,racker ,racket ,raffle ,ragbag ,raking ,ramble ,rammed ,ramped ,rapped ,rappel ,raunch ,raving ,reavow ,rebook ,reclip ,recook ,recork ,recoup ,rectum ,refilm ,reflow ,remake ,remark ,remove ,repark ,repave ,reperk ,replow ,replug ,reskew ,retack ,reverb ,review ,rework ,rewove ,rhymer ,rhymes ,ribbed ,ribbon ,rimmed ,ripped ,ripple ,riving ,robbed ,robbin ,rocker ,rocket ,romped ,roughy ,roving ,rubber ,rubric ,rumbas ,rummer ,runway ,sacker ,sacrum ,sample ,sapped ,saving ,scalps ,scenic ,sconce ,scoped ,scowls ,scrawl ,scrubs ,scrums ,scubas ,scythe ,septum ,sexier ,sexist ,sextet ,shaken ,sharpy ,shaved ,shaven ,shelve ,shifty ,shoved ,shovel ,shrank ,shrink ,shutup ,shying ,sicker ,sickos ,simple ,sipped ,sixers ,skewer ,skiing ,skulls ,slaggy ,slimly ,slouch ,slowly ,sludgy ,smelly ,smirks ,smithy ,smoker ,smokes ,smudge ,snaggy ,snarky ,sneaky ,sniffs ,snugly ,sobbed ,socket ,sopped ,spaced ,sparks ,spawns ,speaks ,spewed ,spiced ,spiker ,spikes ,spinny ,splice ,spokes ,spooks ,sprawl ,spruce ,sprung ,spumes ,stacks ,stalky ,stepup ,sticks ,stinky ,stocks ,stucco ,stuffs ,stumps ,submit ,subtly ,succor ,suffer ,sulked ,sumacs ,summer ,summit ,sunken ,sunway ,superb ,supper ,survey ,swerve ,swiped ,swishy ,synced ,tabbed ,tacker ,taking ,tamped ,tampon ,tapped ,taxers ,taxies ,teacup ,temple ,thanks ,thatch ,thingy ,thinks ,though ,thymes ,ticker ,ticket ,tipped ,tipple ,toking ,tombed ,topped ,topple ,toughy ,toyboy ,tracks ,trichy ,tricks ,trophy ,trumps ,tubing ,tuffet ,tugrik ,turkey ,tweaks ,umbers ,umpire ,unbend ,unbind ,unblur ,uncage ,unclad ,uncued ,uncurl ,unduly ,uneven ,unfold ,unfond ,unfurl ,unholy ,unknit ,unknot ,unlike ,unlive ,unmold ,unship ,unthaw ,unveil ,unwary ,unwell ,unwill ,unwind ,upbeat ,upland ,uppers ,uptime ,urchin ,uremic ,urnful ,usably ,uvular ,vacate ,vagina ,vaguer ,vagues ,valued ,vandal ,vanish ,vanity ,vapors ,varoom ,vastly ,vector ,vegans ,vended ,venule ,verily ,vesper ,vicars ,victor ,viewer ,vigils ,vigour ,villus ,vipers ,virgin ,virome ,vising ,vogues ,voicer ,voices ,vomits ,voting ,vowers ,voyeur ,vrooms ,wading ,wafted ,wagger ,waiver ,waives ,wakers ,waning ,warble ,warmed ,warped ,wavers ,wavier ,weaker ,weapon ,weaver ,weaves ,wedged ,weighs ,weight ,whaled ,whined ,whoosh ,widely ,widows ,wieldy ,wights ,wiling ,wincer ,winces ,winged ,wining ,wisdom ,wisped ,womans ,womens ,woofed ,woolly ,worker ,worldy ,wormed ,worthy ,wreaks ,wright ,yachts ,yamuns ,yanker ,yauped ,yaupon ,yawled ,yawned ,yellow ,yelped ,yokels ,yonker ,youpon ,yowled ,yukked ,yupons ,abbeys ,abduct ,abulic ,abvolt ,abysms ,aching ,acumen ,adverb ,advice ,afghan ,agency ,albums ,alcove ,alkyne ,ambled ,ampule ,anoxia ,anyhow ,anyway ,apache ,appall ,append ,archly ,armful ,avidly ,avowal ,avowed ,awaked ,awaken ,awoken ,badman ,bagged ,baldly ,balker ,banker ,barful ,barhop ,barked ,basked ,batboy ,bauble ,bawled ,baying ,beaked ,bedamn ,bedaub ,bedlam ,bedpan ,befall ,befell ,begged ,beldam ,bellow ,bevels ,bewray ,bikini ,bilker ,billow ,biopsy ,bishop ,blabby ,blamed ,blebby ,blight ,blobby ,blokes ,bluing ,blurbs ,bogged ,boggle ,boldly ,bonbon ,booked ,boughs ,bought ,bounce ,bovine ,bowled ,bowwow ,boying ,brahma ,braked ,braved ,breach ,breech ,brinks ,broach ,broken ,brooch ,brushy ,budged ,bugeye ,bugger ,bugled ,bulbar ,bulged ,bunged ,bungle ,burble ,burghs ,burlap ,burped ,busker ,bygone ,bypass ,cabled ,caches ,cachet ,caging ,callow ,calmed ,calves ,cancan ,cancel ,canker ,canvas ,carboy ,carved ,cashew ,casked ,catkin ,caucus ,caught ,cavern ,chafer ,chafes ,change ,chanty ,charms ,chasms ,cheapo ,cheeps ,chewer ,chiefs ,chimer ,chimes ,chirps ,choice ,chroma ,chrome ,cilium ,cipher ,clawed ,clayey ,cleave ,clergy ,clerks ,clever ,clinic ,cloaks ,clonic ,cloudy ,clover ,cloves ,clowns ,cobnut ,cogged ,coldly ,concur ,conker ,conman ,cooked ,copula ,corked ,cotype ,coughs ,couped ,couple ,coupon ,covens ,crafty ,cranks ,craved ,creamy ,creepy ,crispy ,crotch ,cruddy ,crwths ,crying ,crypts ,cubane ,cuboid ,cultic ,cumene ,cupids ,cupola ,curbed ,curium ,curlew ,curves ,cuscus ,cuspid ,cutups ,cyclic ,cygnet ,cystic ,cytoma ,dabbed ,dabble ,damask ,dammed ,damped ,dampen ,dapple ,darkly ,debark ,debeak ,decker ,declaw ,dehusk ,delimb ,demark ,device ,dewlap ,dexter ,dextro ,dibbed ,dibble ,dicker ,dictum ,diking ,dimmed ,dimple ,dinghy ,dipped ,diving ,docker ,docket ,donkey ,doubly ,doughy ,druggy ,dubber ,dumber ,dumper ,dunked ,duping ,ectopy ,elixir ,embryo ,embyro ,engulf ,epochs ,eschew ,evenly ,evilly ,evince ,evoker ,evokes ,exalts ,exiles ,exited ,extant ,extent ,extols ,fabled ,falcon ,fallow ,famish ,fathom ,favour ,fawned ,fellow ,fenced ,fervid ,fibula ,fiddly ,fifths ,figged ,filmed ,filthy ,fitful ,flakes ,flamed ,flamen ,flashy ,flasks ,flavor ,flawed ,fleshy ,flight ,flowed ,fogged ,follow ,fondly ,forked ,fought ,franks ,fringy ,frying ,fudged ,fugued ,fungal ,fungus ,gabber ,gabbro ,gaffer ,gambit ,gamely ,gaming ,gammas ,gaping ,gapper ,gauche ,gavage ,geomap ,gleamy ,glitch ,gloomy ,gloved ,gobber ,gobbet ,goodby ,grimly ,grinch ,groggy ,groovy ,grouch ,growly ,grungy ,gulped ,gunman ,gunmen ,gurgly ,halved ,hammer ,hamper ,hawing ,hectic ,hemmer ,hewing ,hipper ,hippie ,hippos ,hobbit ,holdup ,hombre ,homely ,homily ,homing ,honked ,hoping ,hopper ,hugely ,hugged ,hungry ,hunker ,husked ,hybrid ,hydric ,hymens ,hymner ,imbued ,immune ,impend ,impish ,inflow ,inking ,inkpot ,kabala ,kabals ,kahuna ,keenly ,kidney ,kimono ,knifes ,knower ,labium ,lambda ,lambed ,lapped ,launch ,laving ,lawman ,lawmen ,laxest ,legacy ,lewdly ,likely ,liking ,limbed ,limped ,limpid ,lipped ,lively ,living ,lobbed ,locker ,locket ,lopped ,lovely ,loving ,lubing ,luffas ,lumbar ,lumber ,lunacy ,lychee ,macula ,macule ,madman ,madmen ,magmas ,magpie ,mallow ,mangey ,marked ,marvel ,masked ,mauves ,mayday ,medium ,mellow ,memory ,methyl ,mildew ,mildly ,milker ,minced ,minnow ,mishap ,mochas ,mopish ,morphs ,mouldy ,mouthy ,mucins ,mucoid ,mucous ,mudlog ,mugger ,murmur ,muscle ,museum ,musket ,myogen ,myomas ,myopia ,mystic ,nabbed ,nakfas ,napped ,necker ,nibbed ,nibble ,nicker ,niggly ,nimble ,nipped ,nipple ,noncop ,novice ,number ,occult ,offend ,omnium ,oxides ,oxtail ,paging ,palmed ,papaya ,papery ,papule ,papyri ,parked ,pawned ,payday ,paying ,peaked ,peeked ,peeved ,pegged ,pelvis ,pencil ,penman ,penmen ,penpal ,pentup ,perked ,phobia ,phoney ,photic ,phylae ,piddly ,pigged ,pileup ,pillow ,pinker ,pinkie ,pinups ,piracy ,placed ,placid ,plight ,plover ,plowed ,plugin ,plumes ,plunge ,podium ,polkas ,popeye ,porked ,potboy ,potful ,pounce ,powwow ,pranks ,preach ,prepay ,prevue ,pricey ,proved ,proven ,prying ,pueblo ,pulley ,pulper ,pulpit ,pumelo ,pupils ,purfle ,purple ,pyemia ,pyrope ,python ,racked ,razzes ,rebuke ,recked ,reckon ,recopy ,redock ,relock ,revive ,revoke ,rheumy ,rhombi ,rhombs ,rhymed ,richly ,ricked ,rocked ,rubbed ,rubble ,ruffed ,ruffle ,rumble ,rumped ,rumple ,rumpus ,runoff ,sacked ,schema ,scheme ,schism ,scorch ,scotch ,screwy ,sculpt ,sextan ,sexton ,shaggy ,sheikh ,shrimp ,shrunk ,sicked ,sicken ,sickle ,skewed ,skiddy ,skinny ,slacks ,slavic ,slicks ,slinky ,slipup ,slumps ,smarmy ,smirch ,smoked ,smooch ,snacks ,snicks ,snuffs ,socked ,spacey ,spanks ,speech ,spermy ,spicey ,spiked ,spoken ,spongy ,spoofy ,spryly ,spumed ,sputum ,spying ,stemmy ,struck ,subbed ,suburb ,sucker ,summed ,summon ,sunbow ,supped ,supple ,surtax ,swanks ,switch ,swivel ,syphon ,syrupy ,tacked ,tackle ,talcum ,taxied ,thunks ,thymus ,ticked ,tickle ,tinkly ,tomboy ,touchy ,toxins ,trucks ,tucker ,tumble ,twangy ,twelve ,twitch ,typhus ,typing ,umbels ,unbury ,uncaps ,unclog ,unfirm ,unhewn ,unhook ,unkind ,unlink ,unwept ,unwrap ,unyoke ,upheld ,uphill ,uphold ,uplift ,uptake ,uptown ,upward ,vacant ,vagary ,vainly ,valley ,vapour ,vaulty ,veggie ,velcro ,venoms ,verbal ,vermin ,viable ,viewed ,vilely ,vincas ,vining ,vitium ,vocals ,voiced ,volley ,votive ,vowels ,voyage ,vulgar ,waddly ,wafery ,wagged ,waggle ,waging ,waived ,wakens ,walker ,wallop ,wallow ,warmth ,waylay ,weaken ,weaved ,weevil ,wharfs ,whinge ,whirly ,whisps ,whoops ,wigged ,wiggle ,wildly ,willow ,winced ,window ,winker ,winnow ,witchs ,woeful ,wolfed ,wolves ,worked ,wovens ,wretch ,xenias ,yabber ,yammer ,yanked ,yapper ,yawing ,yawper ,yeuked ,yippee ,yippie ,yolked ,yowing ,zizzle ,abamps ,accept ,adnexa ,affect ,affirm ,ambush ,amebic ,axilla ,axonal ,bagman ,bagmen ,bakery ,balked ,bamboo ,bammer ,banked ,barfly ,baulks ,became ,become ,behalf ,behave ,behove ,belfry ,bicarb ,biceps ,bilked ,biopic ,bitmap ,blanks ,bleach ,blinks ,bloomy ,blotch ,blowsy ,bobcat ,bomber ,bonked ,booksy ,bopper ,bowing ,bowleg ,braggy ,branch ,brawly ,brawny ,bubbly ,bugged ,bulbed ,bunker ,busboy ,busked ,buskin ,busway ,buying ,bylaws ,byword ,cached ,calved ,camber ,camper ,canopy ,capper ,caulks ,cavity ,cawing ,cayman ,chafed ,chance ,chapel ,cheeks ,cherub ,chewed ,chilly ,chimed ,chives ,choker ,chokes ,clanks ,cliche ,clingy ,clinks ,cloche ,cloven ,codify ,coffee ,coffer ,cognac ,column ,combat ,comber ,combos ,comedy ,comely ,comics ,coming ,commas ,commit ,conchs ,conked ,coping ,copper ,cosmic ,cowpie ,craggy ,cramps ,crawly ,creaky ,crimps ,croaky ,crouch ,crutch ,cubage ,cuddly ,cumuli ,curved ,cyanic ,cycler ,cycles ,cynics ,cyprus ,dankly ,decked ,deckel ,deckle ,degunk ,dioxin ,docked ,drachm ,drippy ,dubbed ,dubium ,duffel ,dumbed ,dumped ,ebbing ,efface ,effect ,effing ,embody ,employ ,eponym ,evoked ,evolve ,exhort ,exiled ,exodus ,extend ,exudes ,exults ,eyecup ,fabric ,facing ,family ,fecund ,feebly ,femmes ,fibber ,firmly ,fivish ,flaked ,flanks ,flavin ,fleecy ,flimsy ,fluffy ,flukes ,flying ,forcep ,formic ,freaky ,frisky ,froggy ,frowny ,frypan ,fulfil ,funker ,gabbed ,gadfly ,gaffed ,gamble ,gambol ,gapped ,gawker ,geckos ,gelcap ,gemmed ,gibbon ,giggly ,gimbal ,gimped ,ginkgo ,giving ,glibly ,glycol ,gnomic ,gobbed ,gobble ,gruffs ,grumps ,gumbos ,hacker ,hammed ,hangup ,happed ,happen ,haunch ,having ,hawker ,hemmed ,highly ,hiking ,hipped ,hiving ,hoaxer ,hoaxes ,hobble ,hobnob ,hopped ,hopple ,hubber ,hubbub ,hulked ,hummer ,humper ,humpie ,hymnal ,hymned ,iambic ,icecap ,imbibe ,impact ,imping ,infamy ,inkpad ,invivo ,invoke ,ipecac ,izzard ,jeerer ,jester ,jitter ,joists ,jotter ,kevlar ,keying ,keylog ,kidnap ,kindly ,knaves ,knifed ,knight ,knives ,knowns ,lacked ,lankly ,lapful ,lawful ,layoff ,licked ,locked ,logoff ,lookup ,luffed ,lumped ,macaws ,mafics ,mambas ,mambos ,mapper ,marbly ,mashup ,member ,mewing ,midway ,mighty ,milked ,mimics ,miming ,mobber ,modify ,moping ,mopper ,moppet ,mowing ,mugged ,mukluk ,mycoin ,myself ,napkin ,necked ,nephew ,nicked ,nickel ,nickle ,nontax ,nuking ,numbed ,office ,oozers ,oozier ,oxeyes ,pacing ,pampas ,pamper ,pawing ,pectic ,peptic ,phenom ,phenyl ,phloem ,phonic ,pigpen ,piping ,planks ,plonks ,plough ,plumed ,plushy ,plying ,policy ,polyps ,poncho ,preamp ,prefab ,primly ,primps ,prompt ,propyl ,psalmy ,pulped ,purify ,razors ,razzed ,recomb ,resize ,revved ,rhythm ,ripoff ,ripply ,ruckus ,samekh ,scampi ,scamps ,scoffs ,scrimp ,sculks ,seizer ,seizes ,sexual ,shacks ,shocks ,simply ,sixths ,sizers ,sizzle ,sketch ,slippy ,sloppy ,smirky ,smoggy ,smokey ,smudgy ,smugly ,snappy ,sniffy ,snippy ,snobby ,sparky ,spiffs ,spooky ,sprucy ,sticky ,stocky ,stubby ,stuffy ,stumpy ,subway ,sucked ,suckle ,sumach ,swamps ,symbol ,tackey ,thicks ,thorax ,thumbs ,thumps ,thymey ,tipoff ,tricky ,trijet ,tubful ,tucked ,tuxedo ,twiggy ,unclip ,uncork ,unisex ,unkept ,unmake ,unmask ,unmown ,unplug ,upfold ,uppish ,uppity ,upwell ,upwind ,valves ,vapory ,vatful ,vegged ,velvet ,verify ,vodkas ,volume ,walked ,warmly ,waveys ,weblog ,wharve ,whelps ,whence ,whinny ,whisks ,wholly ,wifely ,wilful ,windup ,winked ,winkle ,wiping ,wombat ,wowing ,wrench ,xenons ,xyster ,xystoi ,xystos ,yaffed ,yapoks ,yapped ,yasmak ,yawped ,yclept ,yipped ,yoicks ,yoking ,yuccas ,yuppie ,zanzas ,zeroes ,zoaeae ,zoaeas ,zoaria ,zorses ,zoster ,apexes ,ataxic ,avouch ,axioms ,azalea ,azures ,backer ,baffle ,bagful ,baking ,bammed ,beachy ,bedbug ,bicker ,bigamy ,bigwig ,biking ,blanch ,blench ,blimps ,blokey ,bombed ,bopped ,bouncy ,bowman ,boxers ,boxier ,bricks ,brunch ,buffer ,buffet ,bulked ,bummer ,bumper ,bunked ,burbly ,bypath ,byways ,cabbal ,cabbed ,caecum ,caking ,calmly ,camped ,campus ,capped ,catchy ,caving ,chalks ,chinks ,chirpy ,choked ,civics ,clamps ,clench ,cliffs ,climbs ,clinch ,cloggy ,clumsy ,clunks ,clutch ,coaxer ,coaxes ,cobbed ,cobble ,coffin ,coffle ,coking ,combed ,common ,compel ,convey ,convoy ,copped ,cortex ,cracks ,cranky ,cricks ,crocks ,crumbs ,crunch ,cubing ,cubism ,cupric ,curfew ,cutoff ,cyborg ,cycled ,cyclin ,cypher ,damply ,dazzle ,debunk ,decamp ,deluxe ,dimply ,ditzes ,dozers ,dozier ,ducked ,dumdum ,dyking ,earwax ,effigy ,embalm ,embark ,emblem ,encamp ,equate ,exabit ,exacts ,excess ,excise ,excite ,exhale ,exotic ,expats ,expert ,expire ,export ,expose ,exuded ,faking ,fibbed ,fixate ,fixers ,flambe ,flinch ,fluked ,flunks ,fobbed ,folksy ,foxier ,frocks ,frumps ,fuming ,funked ,gawked ,glumly ,glyphs ,grabby ,grammy ,grippy ,gummed ,hacked ,hackle ,hawked ,haymow ,heckle ,hexane ,hexene ,hiphop ,hoaxed ,hocked ,hookup ,hubbed ,hubble ,huffed ,humble ,hummed ,hummus ,humped ,humvee ,hyphen ,hyping ,ibexes ,improv ,impugn ,iodize ,ionize ,jailer ,jarred ,jeered ,jejuna ,jejune ,jejuni ,jested ,jetted ,jilter ,joiner ,joints ,jolter ,jostle ,jotted ,jousts ,juries ,jurist ,jurors ,juster ,kababs ,kabobs ,kappas ,karmic ,kebabs ,kelvin ,keypad ,kingly ,kipper ,lackey ,laxity ,lazier ,lazies ,limbic ,limply ,linkup ,lucked ,maglev ,magnum ,making ,mapped ,matrix ,mayhap ,mayhem ,meekly ,miffed ,mixers ,mobbed ,mocker ,monkey ,mopped ,moving ,muppet ,muscly ,muskeg ,mythic ,nimbly ,nozzle ,offcut ,onyxes ,oozoid ,oxcart ,oxhide ,packer ,packet ,patchy ,paunch ,paving ,peachy ,pebble ,pecker ,picker ,picket ,picnic ,piking ,pimped ,pimple ,pinkey ,pixies ,plunks ,pocket ,poking ,pommel ,popgun ,pouffe ,poxier ,praxis ,pretax ,pricks ,psyche ,psycho ,psychs ,puffer ,pullup ,pumice ,pumper ,purfly ,purply ,purvey ,pushup ,putoff ,quarts ,quasar ,queers ,quests ,quiets ,quires ,quotas ,quoter ,quotes ,rebuff ,recock ,rejoin ,remixt ,repack ,repump ,revamp ,rezone ,risque ,ruffly ,rumply ,scruff ,scuffs ,scurvy ,seized ,sexily ,sexism ,shabby ,shimmy ,shucks ,sickly ,sixing ,sixmos ,skimps ,sleaze ,slummy ,smacks ,smocks ,sneeze ,snooze ,snubby ,snuffy ,specks ,square ,squats ,squire ,squirt ,stanza ,supply ,swanky ,syntax ,taxing ,teabox ,thymic ,tickly ,toques ,torque ,typify ,umping ,undock ,unlock ,untuck ,uplink ,upping ,valved ,vellum ,viably ,victim ,vilify ,vowing ,vulvae ,vulvar ,vulvas ,wabble ,waffle ,waggly ,waking ,warmup ,wavily ,waving ,waxers ,waxier ,weakly ,webbed ,weekly ,whelks ,whimsy ,wicker ,wicket ,wiggly ,wigwag ,wimble ,wimped ,witchy ,wiving ,wobble ,wombed ,wracks ,wrecks ,xrayed ,xylose ,xystus ,yacked ,zanier ,zanies ,zealot ,zeatin ,zeroed ,zested ,zizith ,zonate ,zoners ,zooids ,zorils ,adjoin ,adjure ,adjust ,admixt ,anoxic ,axeman ,backed ,baulky ,beckon ,bedeck ,benumb ,blacks ,blocks ,bluffs ,buccal ,bucket ,buffed ,bumble ,bummed ,bumped ,byplay ,cackle ,calxes ,chaffs ,champs ,chancy ,cheeky ,chimps ,chomps ,chunks ,church ,clacks ,clicks ,clocks ,clumps ,coaxed ,cocked ,cockle ,corymb ,cowboy ,crabby ,crappy ,crimpy ,cruxes ,cuckoo ,cuffed ,cupped ,dozens ,dumbly ,eggcup ,embank ,equals ,equine ,exceed ,excels ,excuse ,expels ,fezzes ,fickle ,fizzes ,flacks ,flecks ,flexes ,flexor ,flicks ,flocks ,flukey ,flybys ,flyway ,fornix ,fumble ,gazers ,globby ,grazer ,grazes ,grubby ,gruffy ,grumpy ,gypsum ,hazier ,hickey ,hockey ,hunchy ,injure ,jailed ,jamjar ,jaunts ,jellos ,jersey ,jilted ,joined ,jojoba ,jolted ,josher ,joshes ,joules ,julies ,junior ,juntas ,juried ,justin ,jutted ,kabbal ,kibble ,larynx ,liquor ,lizard ,lymphs ,lynxes ,makeup ,markup ,mayfly ,minxes ,mocked ,mucker ,muffed ,muffin ,muffle ,mugful ,mumble ,myopic ,ninjas ,numbly ,nuzzle ,nymphs ,outfox ,oxalic ,oxford ,oxlips ,pablum ,pacify ,packed ,papacy ,payoff ,pecked ,pelvic ,phlegm ,phobic ,piazza ,picked ,pickle ,pinkly ,pixels ,pizzas ,plumbs ,plumps ,pocked ,prolix ,public ,pucker ,puffed ,puffin ,puking ,pummel ,pumped ,pyemic ,quails ,quaint ,quanta ,queens ,queuer ,queues ,quilts ,quinoa ,quints ,quired ,quited ,quoted ,reflex ,rejigs ,scabby ,scolex ,sequel ,sequin ,sixgun ,snazzy ,spammy ,spiffy ,spunky ,squads ,squeal ,squids ,squint ,swabby ,swampy ,taxman ,taxmen ,unsexy ,upflow ,upkeep ,uptick ,vamped ,vertex ,vexers ,viking ,vortex ,vulval ,whammo ,whiffs ,whisky ,wicked ,wigwam ,workup ,xylans ,xylene ,xyloid ,yucked ,zanana ,zander ,zenana ,zinnia ,zither ,zondas ,zoonal ,zooned ,zoysia ,amazes ,axlike ,bazaar ,boozer ,boozes ,brazes ,breeze ,bricky ,bucked ,buckle ,bunchy ,buzzer ,buzzes ,chalky ,checks ,chicks ,chocks ,chumps ,clammy ,clucks ,clunky ,cobweb ,comply ,cozier ,cozies ,crazes ,crumby ,crummy ,cubify ,cupful ,cymbal ,deejay ,ejecta ,ejects ,enjoys ,equity ,expand ,expend ,expiry ,fajita ,fizzed ,fizzle ,flabby ,flaxen ,flexed ,flippy ,floppy ,flunky ,fluxes ,freeze ,frieze ,frumpy ,fuzzes ,galaxy ,gauzes ,glazes ,glozes ,grazed ,guffaw ,guzzle ,hallux ,hatbox ,hazard ,hazels ,hexing ,hexyne ,hiccup ,hotbox ,hubcap ,humbly ,humbug ,jadish ,jaguar ,jargon ,jasper ,jelled ,jetlag ,jihadi ,jihads ,joshed ,joyous ,keyfob ,kungfu ,kwacha ,liquid ,lockup ,luxury ,majors ,mazers ,mazier ,mickey ,mucked ,occupy ,oozily ,oozing ,oxlike ,oxygen ,pebbly ,phylum ,pimply ,plexus ,plucks ,plunky ,pompom ,popoff ,prizes ,punchy ,quarry ,queasy ,queery ,quells ,queued ,quills ,ramjet ,razing ,reflux ,reject ,scummy ,sheqel ,sizing ,skimpy ,sleazy ,sneezy ,snoozy ,specky ,spritz ,squall ,squash ,squish ,suckup ,thwack ,tweeze ,uncock ,uncuff ,unique ,unjust ,unmixt ,unpack ,unpick ,vacuum ,vixens ,wabbly ,walkup ,webcam ,whacko ,whacks ,whelky ,windex ,wobbly ,yapock ,yutzes ,zamias ,zareba ,zariba ,zayins ,zebras ,zenith ,zibets ,zigzag ,zinger ,zirams ,zlotys ,zonary ,zonula ,zonule ,zounds ,abjure ,ablaze ,acquit ,amazed ,amazon ,banjos ,basque ,bemock ,bisque ,blazer ,blazes ,blocky ,boozed ,boxcar ,boxing ,brazed ,brazen ,brazil ,bronze ,buzzed ,cackly ,cajole ,chaffy ,chappy ,chippy ,choppy ,chucks ,chunky ,cirque ,clumpy ,cozied ,crazed ,dazing ,deject ,dozily ,dozing ,duplex ,equips ,except ,exempt ,exhume ,expect ,exwife ,faxing ,fixing ,fjords ,flecky ,fluxed ,foxily ,foxing ,frizzy ,frozen ,fuzzed ,gauzed ,glazed ,glozed ,icebox ,influx ,inject ,injury ,jading ,jangle ,jaunty ,jerker ,jewels ,jingle ,jivers ,jivier ,jogger ,jokers ,jowler ,judger ,judges ,juicer ,juices ,jujube ,justly ,kazoos ,knobby ,kvetch ,lazily ,lazing ,marque ,masque ,maxima ,maxims ,mixing ,mosque ,mumbly ,muzzle ,nazism ,opaque ,oxbows ,piques ,plazas ,plummy ,prefix ,premix ,prized ,puzzle ,qabala ,qabals ,qubits ,quinsy ,sphinx ,squabs ,squirm ,upsize ,vivify ,waxily ,waxing ,whammy ,whiffy ,wizard ,wizens ,xebecs ,xylems ,xylyls ,yanqui ,zanily ,zillah ,zinged ,zircon ,zodiac ,zoning ,zoomed ,zygose ,zygote ,backup ,blazed ,blazon ,blintz ,boozey ,breezy ,cervix ,chubby ,chummy ,climax ,clique ,coccyx ,dezinc ,gazebo ,gazing ,glitzy ,hazily ,hazing ,hazmat ,injoke ,inkjet ,jagged ,jarful ,jerked ,jigged ,jiggle ,jigsaw ,jinker ,jogged ,jovial ,jowled ,joying ,judged ,juiced ,juleps ,jungle ,mixups ,mockup ,navajo ,nonjob ,pickup ,piqued ,plaque ,plucky ,quakes ,qualms ,quarks ,quaver ,quight ,quince ,quirks ,quiver ,quorum ,scuzzy ,squeak ,suffix ,syzygy ,unzips ,vexing ,wheeze ,zaftig ,zagged ,zibeth ,zigged ,zinced ,zoftig ,zouave ,zymase ,abject ,boxful ,bronzy ,cheque ,chintz ,convex ,cozily ,eczema ,efflux ,enzyme ,frenzy ,jabber ,jalopy ,jammer ,jampot ,jangly ,jawing ,jingly ,jinked ,jobber ,jugged ,juggle ,junker ,junket ,logjam ,lummox ,mazily ,mazing ,muskox ,myxoma ,object ,pajama ,pegbox ,quaked ,qubyte ,quetch ,quiche ,whizzy ,zaddik ,zaffar ,zaffer ,zaffir ,zaffre ,zapper ,zebecs ,zechin ,zedonk ,zeugma ,zipper ,zombie ,zombis ,zonked ,zydeco ,blowze ,cowpox ,jabbed ,jacket ,jammed ,jiggly ,jiving ,jobbed ,joking ,joyful ,jumper ,junked ,kibitz ,kudzus ,qabbal ,quaffs ,quench ,quiffs ,quirky ,wheezy ,zapped ,zebubs ,zephyr ,zincic ,zipped ,zonkey ,zygoma ,jackal ,jacked ,jazzes ,jinxes ,jugful ,juking ,jumble ,jumped ,klutzy ,kwanza ,moujik ,mujiks ,pickax ,pyjama ,quacks ,squawk ,zincks ,blowzy ,hijack ,jazzed ,jinxed ,jockey ,jumbly ,muzhik ,quacky ,quartz ,zebeck ,zincky ,queazy ,muzjik".split(" ,");
        var passid = null;
        var success_code = "AJ" + 5*7 + "KM";      // AJ35KM
        var timer = null;

        var passTimer = function() {
            console.log("The timer has started!");
            flag = false;
            timer = window.setTimeout(function() {
                flag = true;
                console.log(flag);
                console.log("The timer ended!");
                if (cam_list[selected_cam] !== 1) {
                    cam_list[selected_cam] = 2;
                }
            }, 64000);
        };

        me.handle = function (session, param1, param2) {
            param1 = makeLower(param1);

            switch(param1) {
                case "status-ls":
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
                        "\nList of security cams and status:",
                        "===============================\n"
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
                        cam_list[selected_cam] = 1;                  // The user tried to guess on a cam not listed
                    } else if (cam_list[selected_cam] === 1) {
                        session.output.push({ output: true, text: [
                            "The camera has already been hacked!"
                        ], breakLine: true });
                        break;
                    } else if (passid === null || selected_cam === null) {
                        session.output.push({ output: true, text: [
                            "An ANTENNA session for this camera was not started!"
                        ], breakLine: true });
                    } else {
                        session.output.push({ output: true, text: [
                            "The password was incorrect."
                        ], breakLine: true });
                    }
                    break;
                case "select":
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
                        console.log("Timer was cleared!");
                    }

                    // Do a check to see if the supplied camera name is in the list
                    if ((Object.keys(cam_list).indexOf(selected_cam) > -1) === false) {
                        session.output.push({ output: true, text: [
                            "This camera does not exist!"
                        ], breakLine: true });
                        break;
                    }

                    // Reset the timed out flag
                    flag = false;
                    // Select a random password for the camera
                    passid = Math.floor((Math.random() * password_list.length) + 1);
                    var cam_password = password_list[passid];
                    var random_letter_num1 = Math.floor((Math.random() * cam_password.length) + 1);
                    var random_letter_num2 = Math.floor((Math.random() * cam_password.length) + 1);
                    var random_letter_1 =  cam_password[random_letter_num1];
                    var random_letter_2 = cam_password[random_letter_num2];
                    if (random_letter_num1 === random_letter_num2) {
                        while (random_letter_num1 === random_letter_num2) {
                            random_letter_num2 = Math.floor((Math.random() * cam_password.length) + 1);
                            random_letter_2 = cam_password[random_letter_num2];
                        }
                    } else if (random_letter_1 === undefined) {
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
                    console.log(random_letter_1);
                    console.log(random_letter_2);
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
                    console.log(cam_password);
                    passTimer();
                    // We set this camera as having begun a session
                    cam_list[selected_cam] = 3;
                    break;
                case "op-complete":
                    var success_cnt = 0;
                    for (var key in cam_list) {
                        if (cam_list[key] === 1) {
                            success_cnt++;
                        }
                    }
                    if (success_cnt >= 2) {
                        session.output.push({ output: true, text: [
                            "Operation completed successfully! Success code is " + success_code
                        ], breakLine: true });
                        break;
                    } else {
                        session.output.push({ output: true, text: [
                            success_cnt + "/3 cameras were hacked. At least 2/3 needed to complete mission."
                        ], breakLine: true });
                        break;
                    }
                default:
                    session.output.push({ output: true, text: [
                        "Command could not execute!",
                        "Camera has already been hacked, is locked out or has not been selected for a session."
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

    var stingerRaidCommandHandler = function () {

        var me = {};
        me.command = 'stinger-strike';
        me.description = ['Raid a facility!',
            "Example: stinger-strike status RoomID (Gives the status of all rooms in facility)",
            "Example: stinger-strike hack RoomID command status (Begin a raid on a specific room)"
        ];

        // Enter variables here
        var room_obj = {
            room_3: {
                "name": "[Lab 3 - Bioweapons]",
                "door_status": true,
                "motion_status": false,
                "finger_status": true,
                "distraction": false,
                "finger_scanner": false,
                "downloader": false,
                "entry_success": false,
                "exit_success": false,
                "room_success": false
            },
            room_2: {
                "name": "[Lab 2 - Rift Creature Containment]",
                "door_status": true,
                "motion_status": false,
                "finger_status": false,
                "distraction": false,
                "finger_scanner": false,
                "downloader": false,
                "entry_success": false,
                "exit_success": false,
                "room_success": false
            },
            room_1: {
                "name": "[Lab 1 - Teleportation Particle Lab]",
                "door_status": true,
                "motion_status": true,
                "finger_status": true,
                "distraction": false,
                "finger_scanner": false,
                "downloader": false,
                "entry_success": false,
                "exit_success": false,
                "room_success": false
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
        function setDistract(obj, status) {
            obj.distraction = status;
            if (status === true) {
               return "\nDistraction has been turned ON";
            } else {
                return "\nDistraction has been turned OFF";
            }
        }
        function setScan(obj, status) {
            obj.finger_scanner = status;
            if (status === true) {
                return "\nFingerprint scanner has been turned ON";
            } else {
                return "\nFingerprint scanner has been turned OFF";
            }
        }
        function setDownload(obj, status) {
            obj.downloader = status;
            if (status === true) {
                return "\nDownloader has been turned ON";
            } else {
                return "\nDownloader scanner has been turned OFF";
            }
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
            // Entry success condition for Room 1
            if (
                obj.door_status === false &&
                obj.motion_status === false
            ) {
                setEntry(obj, true);
            } else {
                setEntry(obj, false);
            }
            return obj.entry_success;
        }
        function checkExit(obj) {
            // Exit success condition Room 1
            if (
                obj.door_status === true &&
                obj.motion_status === true &&
                obj.downloader === true &&
                obj.finger_scanner === true
            ) {
                setExit(obj, true);
            } else {
                setExit(obj, false);
            }
            return obj.exit_success;
        }
        function checkRoom(obj) {
            // Room success condition Room 1
            if (
                obj.entry_success === true &&
                obj.exit_success === true

            ) {
                setRoom(obj, true);
            } else {
                setRoom(obj, false);
            }
            return obj.room_success;
        }

        //Specify params here
        me.handle = function (session, param1, param2, param3, param4) {
            param1 = makeLower(param1);
            param2 = makeLower(param2);
            param3 = makeLower(param3);
            param4 = makeLower(param4);

            // Print out status of all rooms
            var room_list_print = function() {
                for (var room in room_obj) {
                    session.output.push({ output: true, text: [
                        "Room name: " + room_obj[room].name
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
            switch (param1) {
                case "list":
                    room_list_print();
                    break;
                case "hack":
                    switch(param3) {
                        case "door":
                            if (param4 === "on") {
                                session.output.push({ output: true, text: [setDoor(room_obj[param2], true)], breakLine: true});
                            }
                            else if (param4 === "off") {
                                session.output.push({ output: true, text: [setDoor(room_obj[param2], false)], breakLine: true});
                            } else {
                                console.log("Could not do!");
                            }
                            break;
                        case "motion":
                            if (param4 === "on") {
                                session.output.push({ output: true, text: [setMotion(room_obj[param2], true)], breakLine: true});
                            }
                            else if (param4 === "off") {
                                session.output.push({ output: true, text: [setMotion(room_obj[param2], false)], breakLine: true});
                            } else {
                                console.log("Could not do!");
                            }
                            break;
                        case "distract":
                            if (param4 === "on") {
                                session.output.push({ output: true, text: [setDistract(room_obj[param2], true)], breakLine: true});
                            }
                            else if (param4 === "off") {
                                session.output.push({ output: true, text: [setDistract(room_obj[param2], false)], breakLine: true});
                            } else {
                                console.log("Could not do!");
                            }
                            break;
                        case "scanner":
                            if (param4 === "on") {
                                session.output.push({ output: true, text: [setScan(room_obj[param2], true)], breakLine: true});
                            }
                            else if (param4 === "off") {
                                session.output.push({ output: true, text: [setScan(room_obj[param2], false)], breakLine: true});
                            } else {
                                console.log("Could not do!");
                            }
                            break;
                        case "downloader":
                            if (param4 === "on") {
                                session.output.push({ output: true, text: [setDownload(room_obj[param2], true)], breakLine: true});
                            }
                            else if (param4 === "off") {
                                session.output.push({ output: true, text: [setDownload(room_obj[param2], false)], breakLine: true});
                            } else {
                                console.log("Could not do!");
                            }
                            break;
                    }
                    break;
                case "status":
                    if (param2 === "room_1" || param2 === "room_2" || param2 === "room_3") {
                        checkRoom(room_obj[param2]);
                        session.output.push({ output: true, text: [
                            "Room name: " + room_obj[param2].name,
                            "Access control status: " + room_obj[param2].door_status,
                            "Motion sensor status: " + room_obj[param2].motion_status,
                            "Database fingerprint auth: " + room_obj[param2].finger_status + "\n",
                            "Room cleared: " + room_obj[param2].room_success
                        ], breakLine: true});
                        session.output.push({ output: true, text: ["\n"], breakLine: false});
                    }
                    break;
                case "raid-entry":
                        if (param2 === "room_1" || param2 === "room_2" || param2 === "room_3") {
                            console.log(room_obj[param2]);
                            checkEntry(room_obj[param2]);
                            if (room_obj[param2].entry_success === true) {
                                session.output.push({
                                    output: true,
                                    text: [room_obj[param2].name + " entry was a success!"],
                                    breakLine: true});
                            } else {
                                session.output.push({
                                    output: true,
                                    text: [room_obj[param2].name + " entry was a failure!"],
                                    breakLine: true});
                            }
                            session.output.push({
                                output: true,
                                text: ["\nEntering room..."],
                                breakLine: true});
                        }
                    break;
                case "raid-exit":
                    if (param2 === "room_1" || param2 === "room_2" || param2 === "room_3") {
                        console.log(room_obj[param2]);
                        checkExit(room_obj[param2]);
                        if (room_obj[param2].exit_success === true) {
                            session.output.push({
                                output: true,
                                text: [room_obj[param2].name + " exit was a success!"],
                                breakLine: true
                            });
                        }  else {
                            session.output.push({
                                output: true,
                                text: [room_obj[param2].name + " exit was a failure!"],
                                breakLine: true
                            });
                        }
                        session.output.push({ output: true, text: [
                            "\nExiting room..."
                        ], breakLine: true});
                    }
                    break;
                default:
                    console.log("OOOPS!");
            }

        };
        return me;
    };
    commandBrokerProvider.appendCommandHandler(stingerRaidCommandHandler());

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