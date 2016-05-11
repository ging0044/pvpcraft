/**
 * Created by macdja38 on 2016-04-25.
 */
"use strict";

var Utils = require('../lib/utils');
var utils = new Utils();

var Player = require('../lib/player.js');

var key = require('../config/auth.json').youtubeApiKey || null;
if (key == "key") {
    key = null;
}

var text;

module.exports = class music {
    constructor(cl) {
        this.client = cl;
        /**
         * holds array of servers channels and their bound instances.
         * @type {Array}
         */
        this.boundChannels = [];
    }

    getCommands() {
        return ["init", "play", "skip", "list", "next", "destroy", "logchannel"];
    }

    onDisconnect() {
        for (var i in this.boundChannels) {
            if (this.boundChannels.hasOwnProperty(i))
                this.boundChannels[i].destroy();
        }
    }

    onCommand(msg, command, perms, l) {
        console.log("Music initiated");
        if (!msg.channel.server) return; //this is a pm... we can't do music stuff here.
        var id = msg.channel.server.id;
        if (command.command === "init" && perms.check(msg, "music.init")) {
            if (this.boundChannels.hasOwnProperty(id)) {
                msg.reply("Sorry already in use in this server");
                return true;
            }
            if (msg.author.voiceChannel) {
                if (msg.author.voiceChannel.server.id === msg.channel.server.id) {
                    this.boundChannels[id] = new Player(this.client, msg.author.voiceChannel, msg.channel, key);
                    msg.reply("Binding to **" + this.boundChannels[id].voice.name + "** and **" + this.boundChannels[id].text.name + "**");
                    this.boundChannels[id].init(msg, (error)=>{
                        console.log("Bound thing finished maybe");
                        if(error) {
                            console.log(error);
                            msg.reply(error);
                            delete this.boundChannels[id];
                        }
                    });
                }
                else {
                    msg.reply("You must be in a voice channel in this server to use this command here. If you are currently in a voice channel please rejoin it.")
                }
            }
            else {
                msg.reply("You must be in a voice channel this command. If you are currently in a voice channel please rejoin it.")
            }
            return true;
        }

        if (command.command === "destroy" && perms.check(msg, "music.destroy")) {
            if (this.boundChannels.hasOwnProperty(id)) {
                this.boundChannels[id].destroy();
                delete this.boundChannels[id];
            }
            return true;
        }

        if (command.command === "play" && perms.check(msg, "music.play")) {
            if (this.boundChannels.hasOwnProperty(id)) {
                if (command.arguments.length > 0) {
                    this.boundChannels[id].enqueue(msg, command.arguments[0])
                }
                else {
                    msg.reply("Please specify a youtube video!")
                }
            } else {
                msg.reply("Please bind a channel first using " + command.prefix + "init")
            }
            return true;
        }

        if ((command.command === "next" || command.command === "skip") && perms.check(msg, "music.skip")) {
            if (this.boundChannels.hasOwnProperty(id)) {
                this.boundChannels[id].skipSong();
            } else {
                msg.reply("Please bind a channel first using " + command.prefix + "init")
            }
            return true;
        }

        /*
        if (command.command === "pause" && perms.check(msg, "music.pause")) {
            this.boundChannels[id].pause(msg);
            return true;
        }
        if (command.command === "resume" && perms.check(msg, "music.resume")) {
            this.boundChannels[id].resume(msg);
            return true;
        }
        */

        if (command.commandnos === "list" && perms.check(msg, "music.list")) {
            if (this.boundChannels.hasOwnProperty(id)) {
                if(this.boundChannels[id].currentVideo) {
                    msg.channel.sendMessage(this.boundChannels[id].getPrettyList());
                } else {
                    msg.channel.sendMessage("Sorry, no song's found in playlist. use " + command.prefix + "play <youtube vid or playlist> to add one.")
                }
            } else {
                msg.channel.sendMessage("Sorry, Bot is not currently in a voice channel use " + command.prefix + "init while in a voice channel to bind it.")
            }
            return true;
        }

        if (command.commandnos === "logchannel" && perms.check(msg, "music.logchannels")) {
            text = "Playing Music in:\n";
            for (var i in this.boundChannels) {
                if (this.boundChannels.hasOwnProperty(i)) {
                    text += `Server: ${this.boundChannels[i].server.name} in voice channel ${this.boundChannels[i].text.name}\n`
                }
            }
            if (text != "Playing Music in:\n") {
                msg.channel.sendMessage(text);
            }
            else {
                msg.channel.sendMessage("Bot is currently not in use");
            }
            return true;
        }

        return false;
    }
};