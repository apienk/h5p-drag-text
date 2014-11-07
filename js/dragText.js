var H5P = H5P || {};

/**
 * Drag Text module
 * @external {jQuery} $ H5P.jQuery
 */
H5P.DragText = (function ($) {
  //CSS Main Containers:
  var MAIN_CONTAINER = "h5p-drag";
  var INNER_CONTAINER = "h5p-drag-inner";
  var TITLE_CONTAINER = "h5p-drag-title";
  var WORDS_CONTAINER = "h5p-drag-selectable-words";
  var FOOTER_CONTAINER = "h5p-drag-footer";
  var EVALUATION_CONTAINER = "h5p-drag-evaluation-container";
  var BUTTON_CONTAINER = "h5p-button-bar";
  var DROPZONE_CONTAINER = "h5p-dropzone-container";
  var DRAGGABLES_CONTAINER = "h5p-draggables-container";

  //Special Sub-containers:
  var EVALUATION_SCORE = "h5p-drag-evaluation-score";
  var EVALUATION_EMOTICON = "h5p-drag-evaluation-score-emoticon";
  var EVALUATION_EMOTICON_MAX_SCORE = "max-score";
  var DROPZONE = "h5p-dropzone";
  var DRAGGABLE = "h5p-draggable";
  var SHOW_SOLUTION_CONTAINER = "h5p-show-solution-container";

  //CSS Buttons:
  var BUTTONS = "h5p-button";
  var CHECK_BUTTON = "h5p-check-button";
  var RETRY_BUTTON = "h5p-retry-button";
  var SHOW_SOLUTION_BUTTON = 'h5p-show-solution-button';

  //CSS Dropzone feedback:
  var CORRECT_FEEDBACK = 'h5p-correct-feedback';
  var WRONG_FEEDBACK = 'h5p-wrong-feedback';

  /**
   * Initialize module.
   * @param {Object} params Behavior settings
   * @param {Number} id Content identification
   *
   * @returns {Object} C Drag Text instance
   */
  function C(params, id) {
    this.$ = $(this);
    this.id = id;

    // Set default behavior.
    this.params = $.extend({}, {
      taskDescription: "Set in adjectives in the following sentence",
      textField: "This is a *nice*, *flexible* content type, which allows you to highlight all the *wonderful* words in this *exciting* sentence.\n"+
        "This is another line of *fantastic* text.",
      checkAnswer: "Check",
      enableCheckAnswer: true,
      tryAgain: "Retry",
      enableTryAgain: true,
      score: "Score : @score of @total.",
      showSolution : "Show Solution",
      enableShowSolution: true,
      instantFeedback: false
    }, params);
  }

  /**
   * Append field to wrapper.
   * @param {jQuery} $container the jQuery object which this module will attach itself to.
   */
  C.prototype.attach = function ($container) {
    this.$inner = $container.addClass(MAIN_CONTAINER)
        .html('<div class=' + INNER_CONTAINER + '><div class=' + TITLE_CONTAINER + '>' + this.params.taskDescription + '</div></div>')
        .children();
    this.addTaskTo(this.$inner);

    // Add score and button containers.
    this.addFooter();
    this.addDragDropFunctionality()
  };

  /**
   * Append footer to inner block.
   */
  C.prototype.addFooter = function () {
    this.$footer = $('<div class=' + FOOTER_CONTAINER + '></div>').appendTo(this.$inner);
    this.$evaluation = $('<div class=' + EVALUATION_CONTAINER + '></div>').appendTo(this.$footer);
    this.addButtons();
  };

  /**
   * Adds functionality to drag and drop objects.
   */
  C.prototype.addDragDropFunctionality = function () {
    var self = this;

    //Update all droppables
    self.droppablesArray.forEach(function (droppable) {
      droppable.getDropzone().droppable({
        drop: function( event, ui) {
          self.draggablesArray.forEach( function (draggable) {
            if (draggable.getDraggableElement().is(ui.draggable)) {
              droppable.setDraggable(draggable);
            }
          });
          if (self.params.instantFeedback) {
            droppable.setFeedback();
            instantFeedbackEvaluation();
          }
        }
      });
    });

    //Update all draggables
    self.draggablesArray.forEach( function (draggable) {
      draggable.getDraggableElement().draggable({
        revert: function (isValidDrop) {
          this.data("uiDraggable").originalPosition = {
            top: 0,
            left: 0
          };
          var dropzone = draggable.getInsideDropzone();
          if (!isValidDrop) {
            if (dropzone !== null){
              dropzone.removeDraggable();
            }
          }
          else {
            if (dropzone.hasDraggable()){
              dropzone.removeDraggable();
            }
            $(draggable.getDraggableElement()).detach().css({top: 0, left:0 }).appendTo(dropzone.getDropzone());
          }
          if (self.params.instantFeedback) {
            if (dropzone !== null) {
              dropzone.setFeedback();
            }
            instantFeedbackEvaluation();
          }
          return !isValidDrop;
        }
      });
    });

    //Feedback function for checking if all fields are filled, and show evaluation if that is the case.
    function instantFeedbackEvaluation() {
      var allFilled = true;
      self.draggablesArray.forEach(function (entry) {
        if (entry.insideDropzone === null) {
          allFilled = false;
          //Hides "retry" and "show solution" buttons.
          self.$retryButton.hide();
          self.$showAnswersButton.hide();
          self.hideEvaluation();
          return;
        }
      });
      if (allFilled){
        //Shows "retry" and "show solution" buttons.
        self.$retryButton.show();
        self.$showAnswersButton.show();
        self.showEvaluation();
      }
    }

  };


  /**
   * Add check solution, show solution and retry buttons, and their functionality.
   */
  C.prototype.addButtons = function () {
    var self = this;
    self.$buttonContainer = $('<div/>', {'class': BUTTON_CONTAINER});

    // Checking answer button
    self.$checkAnswerButton = $('<button/>', {
      class: BUTTONS+' '+CHECK_BUTTON,
      type: 'button',
      text: this.params.checkAnswer
    }).appendTo(self.$buttonContainer).click(function () {
      self.showEvaluation();
      if (!self.showEvaluation()) {
        if (self.params.enableTryAgain) {
          self.$retryButton.show();
        }
        if (self.params.enableShowSolution) {
          self.$showAnswersButton.show();
        }
      }
      else {
        self.$showAnswersButton.hide();
        self.$retryButton.hide();
        self.$checkAnswerButton.hide();
      }
    });

    //Retry button
    self.$retryButton =  $('<button/>', {
      class: BUTTONS+' '+RETRY_BUTTON,
      type: 'button',
      text: this.params.tryAgain
    }).appendTo(self.$buttonContainer).click(function () {
      self.resetTask();
      self.hideEvaluation();
      self.$retryButton.hide();

      if (self.params.enableCheckAnswer) {
        self.$checkAnswerButton.show();
      }
      if (self.params.enableShowSolution) {
        self.$showAnswersButton.hide();
      }
      self.droppablesArray.forEach(function (droppable) {
        droppable.hideSolution();
      });
    });

    //Show Solution button
    self.$showAnswersButton = $('<button/>', {
      class: BUTTONS+' '+SHOW_SOLUTION_BUTTON,
      type: 'button',
      text: this.params.showSolution
    }).appendTo(self.$buttonContainer).click(function () {
      self.droppablesArray.forEach( function (droppable) {
        droppable.showSolution();
        droppable.removeDraggable()
      });
      self.$showAnswersButton.hide();
    });

    if (!self.params.enableCheckAnswer) {
      self.$checkAnswerButton.hide();
    }

    self.$buttonContainer.appendTo(self.$footer);
  };

  /**
   * Resets the draggables back to their original position.
   */
  C.prototype.resetTask = function () {
    this.draggablesArray.forEach(function (entry) {
      entry.removeFromZone();
      entry.resetPosition();
    });
  };

  /**
   * Evaluate task and display score text for word markings.
   *
   * @return {Boolean} Returns true if maxScore was achieved.
   */
  C.prototype.showEvaluation = function () {
    this.hideEvaluation();
    this.calculateScore();

    var score = this.correctAnswers;
    var maxScore = this.droppablesArray.length;

    var scoreText = this.params.score.replace(/@score/g, score.toString())
      .replace(/@total/g, maxScore.toString());

    //Append evaluation emoticon and score to evaluation container.
    $('<div class='+EVALUATION_EMOTICON+'></div>').appendTo(this.$evaluation);
    $('<div class=' + EVALUATION_SCORE + '>' + scoreText + '</div>').appendTo(this.$evaluation);

    if (score === maxScore) {
      this.$evaluation.addClass(EVALUATION_EMOTICON_MAX_SCORE);
      if (!this.params.instantFeedback) {
        this.disableDraggables();
      }
    }
    else {
      this.$evaluation.removeClass(EVALUATION_EMOTICON_MAX_SCORE);
    }
    return score === maxScore;
  };

  /**
   * Calculate score and store them in class variables.
   */
  C.prototype.calculateScore = function () {
    var self = this;
    self.correctAnswers = 0;
    self.droppablesArray.forEach(function (entry) {
      if(entry.isCorrect()) {
        self.correctAnswers += 1;
      }
    });
  };

  /**
   * Clear the evaluation text.
   */
  C.prototype.hideEvaluation = function () {
    this.$evaluation.html('');
  };
  
  /**
   * Handle task and add it to container.
   * @param {jQuery} $container The object which our task will attach to.
   */
  C.prototype.addTaskTo = function ($container) {
    var self = this;
    self.clozesArray = [];
    self.droppablesArray = [];
    self.draggablesArray = [];

    self.$draggables = $('<div/>', {
      class: DRAGGABLES_CONTAINER
    });
    self.$wordContainer = $('<div/>', {'class': WORDS_CONTAINER});
    self.handleText();

    //$wordContainer.html(textField);
    self.$wordContainer.appendTo($container);
    self.$draggables.appendTo($container);
  };

  /**
   * Parses the text and sends identified clozes to the addCloze method for further handling.
   * Appends the parsed text to wordContainer.
   */
  C.prototype.handleText = function () {
    var self = this;
    var textField = self.params.textField;
    // Go through the text and replace all the asterisks with input fields
    var clozeStart = textField.indexOf('*');
    var clozeEnd = textField.indexOf('*');
    var currentIndex = 0;
    while (clozeStart !== -1 && clozeEnd !== -1) {
      clozeStart++;
      clozeEnd = textField.indexOf('*', clozeStart);
      if (clozeEnd === -1) {
        continue; // No end
      }
      // Create new cloze
      self.$wordContainer.append(textField.slice(currentIndex, clozeStart - 1));
      self.addCloze(textField.substring(clozeStart, clozeEnd));
      clozeEnd++;
      currentIndex = clozeEnd;

      // Find the next cloze
      clozeStart = textField.indexOf('*', clozeEnd);
    }
    self.$wordContainer.append(textField.slice(currentIndex, textField.length-1));
  };

  /**
   * Makes a cloze from the specified text, creates a draggable and droppable object and pushes
   * them to their respective arrays.
   * @param {String} text Text that will be made into a cloze.
   */
  C.prototype.addCloze = function (text) {
    var self = this;
    var tip = undefined;
    var answer = text;
    var answersAndTip = answer.split(':');

    if(answersAndTip.length > 0) {
      answer = answersAndTip[0];
      tip = answersAndTip[1];
    }

    var draggable = new Draggable(answer);
    draggable.appendDraggableTo(self.$draggables);
    var droppable = new Droppable(answer, tip);
    droppable.appendDroppableTo(self.$wordContainer);
    self.draggablesArray.push(draggable);
    self.droppablesArray.push(droppable);
  };

  /**
   * Disables all draggables, user will not be able to interact with them any more.
   */
  C.prototype.disableDraggables = function () {
    this.draggablesArray.forEach( function (entry) {
      entry.disableDraggable();
    });
  };

  /**
   * Private class for keeping track of draggable text.
   *
   * @param {String} text A string that will be turned into a selectable word.
   */
  function Draggable(text) {
    var self = this;
    self.text = text;
    self.$draggable = null;
    self.insideDropzone = null;

    self.createDraggable();
  }

  /**
   * Disables the draggable, making it immovable.
   */
  Draggable.prototype.disableDraggable = function () {
    this.$draggable.draggable({ disabled: true});
  };

  /**
   * Creates the draggable and adds the revert functionality for it.
   */
  Draggable.prototype.createDraggable = function () {
    var self = this;
    this.$draggable = $('<div/>', {
      html: this.text,
      class: DRAGGABLE
    }).draggable({
        revert: function (isValidDrop) {
          this.data("uiDraggable").originalPosition = {
            top: 0,
            left: 0
          };
          if (!isValidDrop) {
            self.removeFromZone();
            return true;
          }
        }
    });
  };

  /**
   * Appends this draggable to the provided container.
   * @param {jQuery} $container JQuery object this draggable is appended to.
   */
  Draggable.prototype.appendDraggableTo = function ($container) {
    this.$draggable.appendTo($container);
  };

  /**
   * Gets the draggable jQuery object for this class.
   *
   * @returns {jQuery} Draggable item.
   */
  Draggable.prototype.getDraggableElement = function () {
    return this.$draggable;
  };

  /**
   * Resets the position of this draggable.
   */
  Draggable.prototype.resetPosition = function () {
    this.$draggable.css({ left: 0, top:0 });
  };

  /**
   * Removes this draggable from its dropzone, if it is contained in one.
   */
  Draggable.prototype.removeFromZone = function () {
    if (this.insideDropzone) {
      this.insideDropzone.removeDraggable();
    }
    this.insideDropzone = null;
  };

  /**
   * Adds this draggable to the given dropzone.
   * @param {jQuery} droppable The droppable this draggable will be added to.
   */
  Draggable.prototype.addToZone = function (droppable) {
    if (this.insideDropzone) {
      this.insideDropzone.removeDraggable();
    }
    this.insideDropzone = droppable;
  };

  /**
   * Gets the dropzone which the draggable is inside.
   *
   * @returns {Droppable} The Droppable which this draggable is inside.
   */
  Draggable.prototype.getInsideDropzone = function () {
    return this.insideDropzone;
  };

  /**
   * Gets the answer text for this draggable.
   *
   * @returns {String} The answer text in this draggable.
   */
  Draggable.prototype.getAnswerText = function () {
    return this.text;
  };

  /**
   * Private class for keeping track of droppable zones.
   *
   * @param {String} text The correct text string for this drop box.
   * @param {String} tip A tip for this container, optional to provide.
   * @param {Array} draggablesArray Array for keeping track of all the draggables, might want to remove.
   * @param {Boolean} instantFeedback Decides whether the dropbox should give instant feedback upon drop.
   */
  function Droppable(text, tip) {
    var self = this;
    self.text = text;
    self.tip = tip;
    self.containedDraggable = null;
    self.$dropzoneContainer = null;
    self.$dropzone = null;

    self.createDroppable();
  }

  /**
   * Creates the droppable container for this class.
   */
  Droppable.prototype.createDroppable = function () {
    var self = this;
    self.$dropzoneContainer = $('<div/>', {
      class: DROPZONE_CONTAINER
    });

    self.$dropzone = $('<div/>', {
      class: DROPZONE
    }).appendTo(self.$dropzoneContainer);

    if(self.tip !== undefined) {
      self.$dropzoneContainer.append(H5P.JoubelUI.createTip(self.tip, self.$dropzoneContainer));
    }

    self.$showSolution = $('<div/>', {
      class: SHOW_SOLUTION_CONTAINER,
      text: self.text
    }).appendTo(self.$dropzoneContainer).hide();
  };

  /**
   * Displays the solution next to the drop box.
   */
  Droppable.prototype.showSolution = function () {
    this.$showSolution.show();
  };

  /**
   * Hides the solution.
   */
  Droppable.prototype.hideSolution = function () {
    this.$showSolution.hide();
  };

  /**
   * Appends the droppable to the provided container.
   * @param {jQuery} $container Container which the dropzone will be appended to.
   */
  Droppable.prototype.appendDroppableTo = function ($container) {
    this.$dropzoneContainer.appendTo($container);
  };

  /**
   * Sets the contained draggable in this drop box to the provided argument.
   * @param {Draggable} droppedDraggable A draggable that has been dropped on this box.
   */
  Droppable.prototype.setDraggable = function(droppedDraggable) {
    var self = this;
    if (self.containedDraggable === droppedDraggable) {
      return;
    }
    if (self.containedDraggable !== null) {
      self.containedDraggable.resetPosition();
      self.containedDraggable.removeFromZone();
    }
    self.containedDraggable = droppedDraggable;
    droppedDraggable.addToZone(self);
  };

  /**
   * Removes the contained draggable in this box.
   */
  Droppable.prototype.removeDraggable = function () {
    if (this.containedDraggable !== null) {
      this.containedDraggable = null;
    }
  };

  /**
   * Checks if the dropzone has a draggable inside.
   *
   * @returns {Boolean} True when it has a draggable.
   */
  Droppable.prototype.hasDraggable = function () {
    return this.containedDraggable !== null;
  };

  /**
   * Checks if this drop box contains the correct draggable.
   *
   * @returns {Boolean} True if this box has the correct answer.
   */
  Droppable.prototype.isCorrect = function () {
    if (this.containedDraggable === null) {
      return false;
    }
    return this.containedDraggable.getAnswerText() === this.text;
  };

  /**
   * Sets CSS styling feedback for this drop box.
   */
  Droppable.prototype.setFeedback = function () {
    if (this.isCorrect()) {
      this.$dropzone.removeClass(WRONG_FEEDBACK);
      this.$dropzone.addClass(CORRECT_FEEDBACK);
    }
    else {
      this.$dropzone.removeClass(CORRECT_FEEDBACK);
      this.$dropzone.addClass(WRONG_FEEDBACK);
    }
  };

  /**
   * Removes all CSS styling feedback for this drop box.
   */
  Droppable.prototype.removeFeedback = function () {
    this.$dropzone.removeClass(WRONG_FEEDBACK);
    this.$dropzone.removeClass(CORRECT_FEEDBACK);
  };

  /**
   * Gets this object's dropzone jQuery object.
   *
   * @returns {jQuery} This object's dropzone.
   */
  Droppable.prototype.getDropzone = function () {
    return this.$dropzone;
  };

    return C;
})(H5P.jQuery);