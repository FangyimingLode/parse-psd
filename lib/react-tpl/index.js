module.exports = (content, className) => `import React from 'React';
import './index.css';

export default class ${className} extends React.Component {
  render() {
    return (\n${content}
    )
  }
}
`;