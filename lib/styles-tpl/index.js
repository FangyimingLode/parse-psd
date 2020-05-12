module.exports = (className, styles) => `.${className} {
  position: absolute;
  top: ${styles.top}px;
  left: ${styles.left}px;
  width: ${styles.width}px;
  height: ${styles.height}px;
  z-index: ${styles.zIndex}; ${
    styles.backgroundImage
    ? `\n  background: url(${styles.backgroundImage}) no-repeat;\n  background-size: ${styles.width}px ${styles.height}px;`
    : ''
  }
}
`;