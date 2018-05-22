const Commando = require('discord.js-commando');
const findSdtdServer = require('../../util/findSdtdServer.js');
const fs = require('fs');
const checkIfAdmin = require('../../util/checkIfAdmin');

class Lookup extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'lookup',
            group: 'sdtd',
            guildOnly: true,
            memberName: 'lookup',
            args: [{
                key: 'playername',
                prompt: 'Please specify a player name to look for',
                type: 'string'
            },
            {
                key: 'server',
                default: 1,
                type: 'integer',
                prompt: 'Please specify what server to run this commmand for!'
            }],
            description: 'Lookup a player profile',
            details: 'This is an admin-only command as it shows IP, location info',
            examples: ["lookup Cata", "lookup bill"]
        });
    }

    async run(msg, args) {
        let sdtdServers = await findSdtdServer(msg);

        if (!sdtdServers.length === 0) {
            return msg.channel.send(`Could not find a server to execute this command for. You can link this guild to your server on the website.`);
        }

        let sdtdServer = sdtdServers[args.server - 1];

        if (!sdtdServer) {
          return msg.channel.send(`Did not find server ${args.server}! Check your config please.`)
        }

        let isAdmin = await checkIfAdmin(msg.author.id, sdtdServer.id);
        if (!isAdmin) {
            let errorEmbed = new client.errorEmbed(`You are not authorized to use \`${this.name}\`.`)
            return msg.reply(errorEmbed)
        }

        let foundPlayer = await sails.models.player.find({
            server: sdtdServer.id,
            name: {
                'contains': args.playername
            },
        })

        if (foundPlayer.length == 0) {
            return msg.channel.send(`Did not find any players with that name!`)
        }

        if (foundPlayer.length > 1) {
            return msg.channel.send(`Found ${foundPlayer.length} players! Narrow your search please`);
        }

        let playerInfo = await sails.helpers.sdtd.loadPlayerData.with({ serverId: sdtdServer.id, steamId: foundPlayer[0].steamId });
        foundPlayer = playerInfo[0];
        let lastOnlineDate = new Date(foundPlayer.lastOnline);
        let embed = new this.client.customEmbed()


        embed.setTitle(`${foundPlayer.name} - profile`)
            .addField('🚫 Banned', foundPlayer.banned ? '✔️' : '✖️', true)
            .addField('💰 Currency', foundPlayer.currency ? foundPlayer.currency : 0, true)
            .addField('⏲️ Last online', lastOnlineDate.toDateString(), true)
            .addField('🗺️ Location', `${foundPlayer.positionX} ${foundPlayer.positionY} ${foundPlayer.positionZ}`, true)
            .addField('🖧 IP', foundPlayer.ip ? foundPlayer.ip : "Unknown", true)
            .addField('👤 Profile', `${process.env.CSMM_HOSTNAME}/player/${foundPlayer.id}/profile`)


            .setFooter(`CSMM - ${sdtdServer.name}`)

        if (foundPlayer.avatarUrl) {
            embed.setThumbnail(foundPlayer.avatarUrl)
        }

        if (foundPlayer.inventory) {
            fs.writeFile(`${sdtdServer.name}_${foundPlayer.id}_inventory.txt`, JSON.stringify(foundPlayer.inventory), err => {
                if (err) {
                    sails.log.error(err)
                }
                msg.channel.send({
                    embed: embed,
                    files: [{
                        attachment: `${sdtdServer.name}_${foundPlayer.id}_inventory.txt`,
                        name: `${sdtdServer.name}_${foundPlayer.id}_inventory.txt`
                    }]
                }).then(response => {
                    fs.unlink(`${sdtdServer.name}_${foundPlayer.id}_inventory.txt`, err => {
                        if (err) {
                            sails.log.error(err)
                        }
                    })
                }).catch(e => {
                    sails.log.error(`DISCORD COMMAND - LOOKUP - ${e}`)
                })
            });
        } else {
            msg.channel.send(embed)
        }


    }

}


module.exports = Lookup;