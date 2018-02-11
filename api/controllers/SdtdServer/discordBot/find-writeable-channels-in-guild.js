module.exports = {


    friendlyName: 'Find channels the bot can write in for a guild ID',
  
  
    description: '',
  
  
    inputs: {
      guildId: {
        example: '1337'
      }
  
    },
  
    exits: {
      badRequest: {
        responseType: 'badRequest'
      }
    },
  
    /**
       * @memberof SdtdServer
       * @method
       * @name find-writeable-channels-in-guild
       * @param {string} guildId
       * @returns {array}
       */
  
    fn: async function (inputs, exits) {

      try {
  
        let discordClient = sails.hooks.discordbot.getClient();
        let guild = discordClient.guilds.get(inputs.guildId);
        if (_.isUndefined(guild)) {
            return exits.badRequest();
        }

        let foundChannels = guild.channels.filter(channel => {
            if (channel.type !== 'text') {
                return false;
            }
            let userPerms = channel.permissionsFor(discordClient.user)
            return userPerms.has('SEND_MESSAGES')
        });

        let foundChannelsArray = Array.from(foundChannels.values());

        exits.success(foundChannelsArray);
        sails.log.debug(`API - SdtdServer:find-writeable-channels-in-guild - Found ${foundChannelsArray.length} channels for guild ${inputs.guildId}!`);
      } catch (error) {
        sails.log.error(`API - SdtdServer:find-writeable-channels-in-guild - ${error}`);
        return exits.error(error);
      }
  
    }
  
  
  };
  