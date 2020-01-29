var React = require('react');

class AdapterMenu extends React.Component {
  render() {
    var style = { "overflowY": "auto"};
    if(this.props.notfull)
      style.height = "calc(100% - 104px)";

    return (
      <ul id="scriptsList" className="sidenav-simple sidenav-simple-expand-fs bg-blue fg-white" style={style}>
        {this.props.list.map((item, index) => 
          <Item item={item} key={index} adapter={this.props.adapterkey} />
        )}
      </ul>
    )
  }
}

class Item extends React.Component {
  render() {
    var url = "#" + this.props.item.key;
    return (
        <li><a id={this.props.item.key} href={url}>
            <span className="mif-file-code icon"></span>
            <span className="title">{this.props.item.title}</span>
        </a></li>
    )
  }
}

module.exports = AdapterMenu;