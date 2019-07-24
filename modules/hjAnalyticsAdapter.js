import adapter from 'src/AnalyticsAdapter';
import adaptermanager from 'src/adapterManager';
const utils = require('src/utils');

const analyticsType = 'endpoint';
const analyticsName = 'HJ Analytics: ';
const url = '/bids/';

let requestId = '';
let auctionStart = 0;
let requests = [];
let responses = [];
let timeouts = [];

let hjAnalytics = Object.assign(adapter({url, analyticsType}), {
  track({eventType, args}) {
    if (eventType == 'bidRequested') {
      requestId = args.auctionId;
      auctionStart = args.auctionStart;
      requests.push.apply(requests, args.bids);
    }
    if (eventType == 'bidResponse') {
      if (pbjs.adserverRequestSent) {
        timeouts.push(args);
      } else {
        responses.push(args);
      }
    }
    if (eventType == 'bidWon') {
      send({
        request: requestId,
        timestamp: auctionStart,
        events: [{
          t: 'w',
          b: args.bidder,
          u: args.adUnitCode.replace('div-gpt-ad-', ''),
          s: args.size,
          c: args.cpm,
          l: args.timeToRespond
        }]});
    }
    if (eventType == 'auctionEnd') {
      utils.logInfo(`${analyticsName} Queued requests`, requests);
      utils.logInfo(`${analyticsName} Queued responses`, responses);
      utils.logInfo(`${analyticsName} Queued timeouts`, timeouts);

      var events = requests.map(function(x) {
        utils.logInfo(x);
        return {
          t: 'r',
          b: x.bidder,
          u: x.adUnitCode.replace('div-gpt-ad-', '')
        };
      })
      events.push.apply(events,
        responses.map(function(x) {
          utils.logInfo(x);
          return {
            t: 'b',
            b: x.bidderCode,
            u: x.adUnitCode.replace('div-gpt-ad-', ''),
            s: x.width + 'x' + x.height,
            c: x.cpm,
            l: x.timeToRespond
          };
        })
      );
      events.push.apply(events,
        timeouts.map(function(x) {
          utils.logInfo(x);
          return {
            t: 't',
            b: x.bidderCode,
            u: x.adUnitCode.replace('div-gpt-ad-', ''),
            s: x.width + 'x' + x.height,
            c: x.cpm,
            l: x.timeToRespond
          };
        })
      );

      var data = {
        request: requestId,
        timestamp: auctionStart,
        events: events
      };

      send(data);
    }
  },
});

function send(data) {
  let fullUrl = url
  let xhr = new XMLHttpRequest();
  xhr.open('POST', fullUrl, true);
  xhr.setRequestHeader('Content-Type', 'text/plain');

  xhr.onreadystatechange = function(result) {
    if (this.readyState != 4) return;

    utils.logInfo('Event sent with result' + result);
  }

  xhr.send(JSON.stringify(data));
};

adaptermanager.registerAnalyticsAdapter({
  adapter: hjAnalytics,
  code: 'hj'
});
