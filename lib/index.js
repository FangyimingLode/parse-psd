const PSD = require('psd');
const path = require('path');
const fs = require('fs');
const rimraf = require('rimraf');

const defaultOptions = {
  root: 'project',
  deletePreviousProject: false,
  useReactTpl: false,
  reactClassName: 'WebApp',
  title: 'my page'
};

let options = {};

module.exports = function psdParse(psdPath, opts = {}) {
  options = {...defaultOptions, ...opts};
  try {
    fs.mkdirSync(options.root);
  } catch (e) {
    if (options.deletePreviousProject) {
      try {
        rimraf.sync(options.root);
        fs.mkdirSync(options.root);
      } catch (e) {
        throw e;
      }
    } else {
      throw e;
    }
  }
  PSD.open(psdPath).then(function (psd) {
    psd.parse();
    createImage(psd.tree(), path.join(options.root, 'images'));
    writeHTML(options.root);
    writeCSS(options.root);
  });
};

function createImage(psd, dir) {
  const isGroup = psd._children.length > 0;
  if (isGroup) {
    // Group
    const group = psd;
    const currentDir = path.join(dir, group.name  || '');
    try {
      fs.mkdirSync(currentDir);
    } catch (err) {
      if (err) {
        if (err.errno === -17) {
          err.message = `图片路径 ${currentDir} 已存在，如有需要请手动备份并删除该文件夹`;
        }
        throw err;
      }
    }
    for (let i = 0; i < group._children.length; i++) {
      
      createImage(group._children[i], currentDir);
    }
  } else {
    // Layer
    psd.layer.image.saveAsPng(path.join(dir, psd.layer.name + '.png'));
  }
}

function createHTML(dir, depth) {
  let html = addSpace(depth);
  
  const className = dirToClassName(dir);
  
  const cls = options.useReactTpl ? 'className' : 'class';
  
  if (/\.png$/.test(dir)) {
    return html + `<div ${cls}="${className}"></div>\n`;
  } else {
    html += `<div ${cls}="${className}">\n`;
  
    html += fs.readdirSync(dir).map(childDir => {
      return createHTML(path.join(dir, childDir), depth+1);
    }).join('');
  
    html += addSpace(depth) + '<div>\n';
    return html;
  }
}

function writeHTML(dir) {
  if (options.useReactTpl) {
    const reactTpl = require('./react-tpl');
    const tpl = reactTpl(createHTML(dir, 3), options.reactClassName);
    fs.writeFileSync(path.join(dir, 'index.jsx'), tpl);
  } else {
    const htmlTpl = require('./html-tpl');
    const tpl = htmlTpl(createHTML(dir, 1), options.title);
    fs.writeFileSync(path.join(dir, 'index.html'), tpl);
  }
}

function writeCSS(dir) {
  
}

function dirToClassName(dir) {
  const result = dir
    .replace(new RegExp(`^${options.root}/images`), '')
    .replace(/^\//, '')
    .replace(/\//g, '-')
    .replace(/\.png$/, '');
  return result;
}

function addSpace(num) {
  let spaces = '';
  for (let i = 0; i < num; i++) {
    spaces += '  ';
  }
  return spaces;
}
