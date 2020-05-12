const PSD = require('psd');
const path = require('path');
const fs = require('fs');
const rimraf = require('rimraf');
const stylesTpl = require('./styles-tpl');
const reactTpl = require('./react-tpl');
const htmlTpl = require('./html-tpl');

const defaultOptions = {
  root: 'project',
  reactClassName: 'WebApp',
  title: 'my page',
  name: 'page',
  deletePreviousProject: false,
  useReactTpl: false,
  useLess: false,
};

let options = {};
let html = '';
let styles = '';

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
    const tabNum = options.useReactTpl ? 3 : 1;
    dfs(psd.tree(), path.join(options.root, 'images'), tabNum);
    writeHTML(options.root);
    writeCSS(options.root);
  });
};

function dfs(psd, dir, tabNum, zIndex = 0, previousTop = 0, previousLeft = 0) {
  const isGroup = psd._children.length > 0;
  const cls = options.useReactTpl ? 'className' : 'class';
  const { width, height, top, left } = psd;
  
  html += addTabs(tabNum);
  
  // Parse Group
  if (isGroup) {
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
    
    const className = dirToClassName(currentDir);
  
    styles += stylesTpl(className, {
      top: top - previousTop,
      left: left - previousLeft,
      width,
      height,
      zIndex
    });
  
    html += `<div ${cls}="${className}">\n`;
    
    
    for (let i = 0, zIndex = group._children.length; i < group._children.length; i++, zIndex--) {
      dfs(group._children[i], currentDir, tabNum + 1, zIndex, width, height);
    }
    
    html += addTabs(tabNum) + '</div>\n';
  
  // Parse Layer
  } else {
    const currentDir = path.join(dir, psd.layer.name + '.png');
    const className = dirToClassName(currentDir);
  
    psd.layer.image.saveAsPng(currentDir);
    
    styles += stylesTpl(className, {
      top: top - previousTop,
      left: left - previousLeft,
      width,
      height,
      zIndex,
      backgroundImage: dirToImageUrl(currentDir)
    });
    
    html += `<div ${cls}="${className}"></div>\n`;
  }
  
}

function writeHTML(dir) {
  const tpl = options.useReactTpl
                ? reactTpl(html, options.reactClassName)
                : htmlTpl(html, options.title);
  const fileName = options.useReactTpl ? 'index.jsx' : 'index.html';
  
  fs.writeFile(path.join(dir, fileName), tpl, err => {
    if (err) {
      throw err;
    }
  });
}

function writeCSS(dir) {
  const fileName = options.useLess ? 'index.less' : 'index.css';
  
  fs.writeFile(path.join(dir, fileName), styles, err => {
    if (err) throw err;
  });
}

function dirToClassName(dir) {
  const result = dir
    .replace(new RegExp(`^${options.root}/images`), options.name)
    .replace(/^\//, '')
    .replace(/\//g, '-')
    .replace(/\.png$/, '');
  return result;
}

function dirToImageUrl(dir) {
  return dir.replace(new RegExp(options.root), '.');
}

function addTabs(num) {
  let spaces = '';
  for (let i = 0; i < num; i++) {
    spaces += '  ';
  }
  return spaces;
}
