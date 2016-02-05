'use strict';

var postcss = require('postcss');

module.exports = function( mixin, size ) {

  var fontFamilyDecl = postcss.decl({
    prop: 'font-family',
    value: '"Gotham A", "Gotham B", sans-serif'
  });

  var fontWeightDecl = postcss.decl({
    prop: 'font-weight',
    value: '400'
  });

  mixin.replaceWith(fontFamilyDecl, fontWeightDecl);
};
