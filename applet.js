const Applet = imports.ui.applet;
const Mainloop = imports.mainloop;
const Soup = imports.gi.Soup;

function MyApplet(orientation, panel_height, instance_id) {
  this._init(orientation, panel_height, instance_id);
}

MyApplet.prototype = {
  __proto__: Applet.TextApplet.prototype,

  _init: function (orientation, panel_height, instance_id) {
    Applet.TextApplet.prototype._init.call(
      this,
      orientation,
      panel_height,
      instance_id
    );

    this._httpSession = new Soup.SessionAsync();
    this._updateData();
  },

  _updateData: function () {
    const url = "http://localhost:5605/";
    const message = Soup.Message.new("GET", url);
    this._httpSession.queue_message(message, this._onData.bind(this));
  },

  _onData: function (session, message) {
    if (message.status_code !== Soup.Status.OK) {
      return;
    }

    const json = JSON.parse(message.response_body.data);
    this.set_applet_label(`${json.stat.co2ppm} ppm`);

    const updateInterval = 10000; // 10 sec
    Mainloop.timeout_add(updateInterval, this._updateData.bind(this));
  },
};

function main(metadata, orientation, panel_height, instance_id) {
  return new MyApplet(orientation, panel_height, instance_id);
}
