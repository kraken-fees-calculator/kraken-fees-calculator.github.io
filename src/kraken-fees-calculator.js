'use strict';

/**
 * Get Kraken fees and profit
 */
class KrakenFeesCalculator {

    /**
     * Get Kraken fees and profit from provided configuration
     * @param {object} options
     * @return {object}
     *
     * @example {options}
     *  {
     *    fees: {
     *      maker: 0.16,
     *      taker: 0.26,
     *    },
     *    trade: {
     *      asset: 'btc',
     *      amount: 1,
     *      direction: 'long',
     *      price_in: 3500,
     *      type_in: 'maker',
     *      price_out: 4000,
     *      type_out: 'maker',
     *      leverage: 1,
     *      duration: 0
     *    }
     *  }
     */
  constructor (options) {
    return this.calculate(options)
  }

  /**
   * Get value of a trade
   * @param {number} amount - amount of coin
   * @param {number} price - price (coin's value)
   * @return {number} trade value
   */
  getValue(amount, price) {
    return amount * price
  }

  /**
   * Get trade fees
   * @param {number} fees - fees without percentage
   * @param {number} amount - amount of coin
   * @param {number} price - price (coin's value)
   * @return {number} Trade fees
   */
  getTradeFees(fees, amount, price) {
    return amount * price * fees / 100
  }

  /**
   * Get margin fees
   * @param {object} options - configuration options
   * @return {object} margin fees (opening and rollover)
   */
  getMarginFees(options) {
    if (options.trade.leverage == 1) {
      return {
        opening: 0,
        rollover: 0,
        leverage: 1
      }
    } else if (options.trade.leverage > 1) {
      var duration = options.trade.duration || 1
      if (options.trade.asset === 'btc') {
        var margin_opening_fees = 0.01
        var margin_rollover_fees = 0.01
      } else {        
        var margin_opening_fees = 0.02
        var margin_rollover_fees = 0.02
      }
      return {
        opening: (options.trade.amount * options.trade.price_in * margin_opening_fees / 100),
        rollover: (options.trade.amount * options.trade.price_in * margin_rollover_fees / 100 * Math.ceil(duration/4)),
        leverage: options.trade.leverage
      }
    };
  }

  /**
   * Get maximum buyable amount including fees
   * @param {number} value - available funds
   * @param {number} price - price (coin's value)
   * @param {number} fees - fees without percentage
   * @return {number} trade value
   */
  getMaxBuyableAmount(value, price, fees) {
    return ((value/price)*(1-(fees/100))).toFixed(8)
  }

  /**
   * Get margin fees
   * @param {object} options - configuration options
   * @return {object} fees and profit for that configuration
   */
  calculate(options) {
    var fees = []
    var value_in = this.getValue(options.trade.amount, options.trade.price_in)
    var value_out = this.getValue(options.trade.amount, options.trade.price_out)
    var opening_fees = this.getTradeFees(eval('options.fees.' + options.trade.type_in), options.trade.amount, options.trade.price_in)
    var closing_fees = this.getTradeFees(eval('options.fees.' + options.trade.type_out), options.trade.amount, options.trade.price_out)
    var margin_fees = this.getMarginFees(options)
    var margin_opening_fees = margin_fees.opening
    var margin_rollover_fees = margin_fees.rollover

    fees.push(opening_fees, closing_fees, margin_opening_fees, margin_rollover_fees)

    var total_fees = fees.reduce((pv, cv) => pv+cv, 0);

    if (options.trade.direction === "long") {
      var profit = (options.trade.price_out - options.trade.price_in) * options.trade.amount
      var net_profit = (options.trade.price_out - options.trade.price_in) * options.trade.amount - total_fees
      var accumulation = null
    } else if (options.trade.direction === "short") {
      var profit = (options.trade.price_in - options.trade.price_out) * options.trade.amount    
      var net_profit = (options.trade.price_in - options.trade.price_out) * options.trade.amount - total_fees
      var accumulation = this.getMaxBuyableAmount(value_in - opening_fees, options.trade.price_out, eval('options.fees.' + options.trade.type_out))
    };

    return {
      'config': options,
      'fees': {
        'opening': opening_fees.toFixed(2),
        'closing': closing_fees.toFixed(2),
        'margin_opening': margin_opening_fees.toFixed(2),
        'margin_rollover': margin_rollover_fees.toFixed(2)
      },
      'result': {
        'value_in': value_in.toFixed(2),
        'value_out': value_out.toFixed(2),
        'total_fees': total_fees.toFixed(2),
        'profit': profit.toFixed(2),
        'net_profit': net_profit.toFixed(2),
        'net_profit_percentage': ((((value_in + net_profit) / value_in) - 1) * 100).toFixed(2),
        'accumulation': accumulation,
        'accumulation_percentage': (((accumulation / options.trade.amount) - 1) * 100).toFixed(2),
      }
    }

  }

};

// exports.KrakenFeesCalculator = KrakenFeesCalculator;
module.exports = KrakenFeesCalculator
