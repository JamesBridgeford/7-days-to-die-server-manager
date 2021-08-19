const enrichers = [
  require('./player'),
  require('./playerKilled'),
  require('./playerDied'),
];

module.exports = async (event) => {
  try {

    let enriched = event;

    for (const enricher of enrichers) {
      enriched = await enricher(enriched);
    }

    return enriched;
  } catch (error) {
    sails.log.warn('Error trying to enrich a log line, this should be OK to fail...');
    sails.log.error(error.message);
    return event;
  }
};
