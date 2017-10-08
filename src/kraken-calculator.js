'use strict';

/**
  * Get Kraken fees from provided configuration
  * @param {object} options
  * @return {object}
  *
  * 'options' example:
  *  {
  *    fees: {
  *      maker: 0.16,
  *      taker: 0.26,
  *    },
  *    trade: {
  *      asset: 'btc',
  *      amount: 1,
  *      price_in: 3500,
  *      type_in: 'maker',
  *      price_out: 4000,
  *      type_out: 'maker',
  *      leverage: 1,
  *      duration: 0
  *    }
  *  }
**/

module.exports = {

  getTransactionFees: function(fees, amount, price) {
    return amount * price * fees / 100
  },

  getMarginFees: function(options) {
    if (options.trade.leverage == 1) {
      return {
        opening: 0,
        rollover: 0
      }
    } else if (options.trade.leverage > 1) {
      var real_leverage = options.trade.leverage-1
      var duration = options.trade.duration || 0
      if (options.trade.asset === 'btc') {
        var margin_opening_fees = 0.01
        var margin_rollover_fees = 0.01
      } else {        
        var margin_opening_fees = 0.02
        var margin_rollover_fees = 0.02
      }
      return {
        opening: (real_leverage * options.trade.amount * options.trade.price_in * margin_opening_fees / 100),
        rollover: (real_leverage * options.trade.amount * options.trade.price_in * margin_rollover_fees / 100 * Math.floor(duration/4))
      }
    };
  },

  calculate: function(options) {
    var fees = []
    var opening_fees = this.getTransactionFees(eval('options.fees.' + options.trade.type_in), options.trade.amount, options.trade.price_in)
    var closing_fees = this.getTransactionFees(eval('options.fees.' + options.trade.type_out), options.trade.amount, options.trade.price_out)
    var margin_fees = this.getMarginFees(options)
    var margin_opening_fees = margin_fees.opening
    var margin_rollover_fees = margin_fees.rollover

    fees.push(opening_fees, closing_fees, margin_opening_fees, margin_rollover_fees)

    var total_fees = fees.reduce((pv, cv) => pv+cv, 0);

    if (options.trade.direction === "long") {
      var profit = (options.trade.price_out - options.trade.price_in) * options.trade.amount - total_fees
    } else if (options.trade.direction === "short") {
      var profit = (options.trade.price_in - options.trade.price_out) * options.trade.amount - total_fees     
    };

    return {
      'fees': {
        'opening': opening_fees.toFixed(2),
        'closing': closing_fees.toFixed(2),
        'margin_opening': margin_opening_fees.toFixed(2),
        'margin_rollover': margin_rollover_fees.toFixed(2)
      },
      'result': {
        'total_fees': total_fees.toFixed(2),
        'profit': profit.toFixed(2)
      }
    }

  }

};

