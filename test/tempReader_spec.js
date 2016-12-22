var TempReader = require('../tempReader');
var subject = new TempReader();

describe('TempReader', function() {
  beforeEach(function() {
    subject.db_refs = {
      lastReading: {
        set: sinon.stub()
      },
      tempList: {
        push: sinon.stub().returns({
          set: sinon.stub()
        })
      }
    };
  });

  describe('logTemp', function() {
    beforeEach(function() {
      subject.getServerTimestamp = sinon.stub().returns('timestamp');
      this.expectedResult = { temperature: 32, timestamp: 'timestamp' };
      subject.toggleLight = sinon.stub();
      subject.lastTemp = 32;

      this.underTest = function(t) {
        subject.logTemp(t);
      };
    });

    it('sets the last reading', function() {
      this.underTest(32);
      sinon.assert.calledWith(subject.db_refs.lastReading.set, this.expectedResult);
    });

    describe('when the temp is equal to the lastTemp', function() {
      it('does not call toggleLight', function() {
        assert(subject.toggleLight.notCalled);
      });
    });

    describe('when the temp is not equal to the lastTemp', function() {
      beforeEach(function() {
        subject.lastTemp = 31;
        this.underTest(32);
      });
      it('saves the new temp to the database', function() {
        sinon.assert.calledOnce(subject.db_refs.tempList.push);
      });
      it('sets the lastTemp to the new temp', function() {
        assert.equal(32, subject.lastTemp);
      });
      it('calls toggleLight', function() {
        sinon.assert.calledOnce(subject.toggleLight);
      });
    });

  });
});