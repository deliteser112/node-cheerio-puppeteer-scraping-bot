module.exports = class GameStats {
  constructor(
    usersrated,
    average,
    bayesaverage,
    ranks,
    stddev,
    median,
    owned,
    trading,
    wanting,
    wishing,
    numcomments,
    numweights,
    averageweight,
  ) {
    this.usersrated = usersrated
    this.average = average
    this.bayesaverage = bayesaverage
    this.ranks = ranks
    this.stddev = stddev
    this.median = median
    this.owned = owned
    this.trading = trading
    this.wanting = wanting
    this.wishing = wishing
    this.numcomments = numcomments
    this.numweights = numweights
    this.averageweight = averageweight
  }
}
