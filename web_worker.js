const pollURL = 'http://api.chartbeat.com/live/toppages/v3/?apikey=317a25eccba186e0f6b558f45214c0e7&host=avc.com&jsonp=handleResponse';




self.addEventListener('message', function (e) {

    WebWorker.start(e);

});




var WebWorker = (function (self) {

    //Private Members
    self.pollingTimer;
    self.currentData;


    //Private Methods
    self.handleResponse = function (data) {

        var pagesArray = data.pages;
        currentData = pagesArray.map(function (data, index) {
            return {
                'id': index,
                'page': data.path,
                'people': data.stats.people,
                'toprefs': data.stats.toprefs
            };
        });

        constructMasterViewHTML(currentData);
    };

    self.constructMasterViewHTML = function (dataArray) {
        var html = '';
        for (var i = 0, len = dataArray.length; i < len; i++) {
            var index = dataArray[i];
            html += "<tr id=" + i + " class='masterRow'><td>" + index.people + "</td><td>" + index.page + "</td></tr>";

        }

        sendMessage({
            'event': 'populateMaster',
            'details': html
        });
    };


    self.constructDetailViewHTML = function (id) {
        var html = ''; 
        
        html += "<tr><td>" + currentData[id].page + "</td></tr>";
        for (var i = 0, len = currentData[id].toprefs.length; i < len; i++) {
            var index = currentData[id].toprefs[i];
            html += "<tr><td>" + index.visitors + "</td><td>" + index.domain + "</td></tr>";
            
        };

         sendMessage({
                'event': 'populateDetails',
                'details': html
            });

    }

    self.sendMessage = function (data) {
        postMessage(JSON.stringify(data));

    };


    return {

        start: function (e) {
            
            var transmission = JSON.parse(e.data);
            switch (transmission.command) {
            case "startPoll":

                importScripts(pollURL);
                pollingTimer = setInterval( function () { importScripts(pollURL) }, 10000);
                break;
            case "stopPoll":
                clearInterval(pollingTimer);
                break;
            case "getDetails":
                constructDetailViewHTML(transmission.details);
                break;
            };


        },

        stop: function () {
            self.close();

        }




    }

})(self);
