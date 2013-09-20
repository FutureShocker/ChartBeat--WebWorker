var ChartBeat = ChartBeat || {};



//Application Mediator
ChartBeat.mediator = (function () {
    var localevents = {};
    var subscribe = function (channel, fn) {
        if (!ChartBeat.mediator.channels[channel]) ChartBeat.mediator.channels[channel] = [];
        ChartBeat.mediator.channels[channel].push({
            context: this,
            callback: fn
        });
        return this;
    },

        publish = function (channel) {
            if (!ChartBeat.mediator.channels[channel]) return false;
            var args = Array.prototype.slice.call(arguments, 1);
            for (var i = 0, l = ChartBeat.mediator.channels[channel].length; i < l; i++) {
                var subscription = ChartBeat.mediator.channels[channel][i];
                subscription.callback.apply(subscription.context, args);
            }
            return this;
        };

    return {
        channels: {},
        publish: publish,
        subscribe: subscribe,
        installTo: function (obj) {
            obj.subscribe = subscribe;
            obj.publish = publish;
        },
        setListeners: function () {
            this.installTo(localevents);
            localevents.subscribe('populateMaster', function (data) {

                ChartBeat.topPagesView.addMasterView(data);

            });

            localevents.subscribe('populateDetails', function (data) {
                ChartBeat.topPagesView.addDetailsView(data);

            });

            localevents.subscribe('appStarted', function (arg) {
                ChartBeat.WebWorker.sendMessage('startPoll');

            });

            localevents.subscribe('getDetails', function (arg) {

                ChartBeat.WebWorker.sendMessage('getDetails', arg);

            })




        }
    };

}());


ChartBeat.topPagesView = (function () {
    var masterView = '';
    var detailView = ''; 
    
    var setPageListeners = function() {

    masterView = document.getElementById('masterView');
    detailView = document.getElementById('detailView');
    listener = masterView.addEventListener("click", function(e) {     
                
      ChartBeat.mediator.publish('getDetails', e.target.parentNode.id);

                    }, false);

    };
    
    return {

        init: function () {
            ChartBeat.mediator.setListeners();
            setPageListeners();
            ChartBeat.mediator.publish('appStarted');



        },

        addMasterView: function (data) {
           masterView.removeEventListener('click', listener, false); 
           masterView.innerHTML = data;


        },

        addDetailsView: function (data) {
            detailView.innerHTML = data;


        },

    }
})();


ChartBeat.WebWorker = (function () {
    var WorkerInstance = new Worker('web_worker.js');


    var receiveMessage = function (e) {
        var payload = JSON.parse(e.data);
        ChartBeat.mediator.publish(payload.event, payload.details);

    };
    return {

        sendMessage: function (command, details) {
            WorkerInstance.postMessage(JSON.stringify({
                'command': command,
                'details': details
            }));
            WorkerInstance.addEventListener('message', function(e) { receiveMessage(e) });


        },

        stopPoll: function () {
            sendMessage('stopPoll');
        }


    }
})();

if (document.readyState == "complete") {
    ChartBeat.topPagesView.init();
} else {
    document.addEventListener("DOMContentLoaded", ChartBeat.topPagesView.init());
};
