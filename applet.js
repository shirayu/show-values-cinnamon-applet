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

    this.json = null;
    this.mode = false;
    this.threshold = 900;
    this._display();
    this._httpSession = new Soup.SessionAsync();
    this._updateData();
  },

  _updateData: function () {
    const url = "http://localhost:5605/";
    const message = Soup.Message.new("GET", url);
    this._httpSession.queue_message(message, this._onData.bind(this));
  },

  _display: function () {
    if (this.json !== null) {
      const ppm = this.json.stat.co2ppm;
      const label = `${ppm} ppm`;
      if (ppm < this.threshold) {
        this.set_applet_label(label);
      } else {
        if (this.mode) {
          this.set_applet_label(`⚠${label}`);
        } else {
          this.set_applet_label(`${label}`);
        }
        this.mode = !this.mode;
      }
    }

    const updateInterval = 500; // 0.5 sec
    Mainloop.timeout_add(updateInterval, this._display.bind(this));
  },

  _onData: function (session, message) {
    if (message.status_code !== Soup.Status.OK) {
      return;
    }

    this.json = JSON.parse(message.response_body.data);

    const updateInterval = 10000; // 10 sec
    Mainloop.timeout_add(updateInterval, this._updateData.bind(this));
  },
};

function main(metadata, orientation, panel_height, instance_id) {
  return new MyApplet(orientation, panel_height, instance_id);
}
