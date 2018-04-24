module.exports = (() => {
  const Direc = require('./direc.js')

  function Pos(row, col) {
    this._row = Math.floor(row || 0)
    this._col = Math.floor(col || 0)
  }

  Pos.prototype.row = function(val) {
    if (val == null) return this._row
    else this._row = val
  }

  Pos.prototype.col = function(val) {
    if (val == null) return this._col
    else this._col = val
  }

  Pos.prototype.clone = function() {
    return new Pos(this._row, this._col)
  }

  Pos.prototype.adj = function(direc) {
    if (direc === Direc.LEFT) {
      return new Pos(this._row, this._col - 1)
    } else if (direc === Direc.RIGHT) {
      return new Pos(this._row, this._col + 1)
    } else if (direc === Direc.UP) {
      return new Pos(this._row - 1, this._col)
    } else if (direc === Direc.DOWN) {
      return new Pos(this._row + 1, this._col)
    } else {
      return Direc.NONE
    }
  }

  return Pos
})()
