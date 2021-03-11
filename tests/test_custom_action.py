from custom_action import custom_action_function


class TestSomething:
    def test_custom_function(self):
        assert custom_action_function() == "custom-action"
