function mySettings(props) {
  const countStr = props.settingsStorage.getItem("bgCount");
  const bgCount = countStr ? parseInt(JSON.parse(countStr)) : 1;

  const slots = [];

  for (let i = 1; i <= bgCount; i++) {
    slots.push(
      <ImagePicker
        key={`bg_image_${i}`}
        settingsKey={`bg_image_${i}`}
        label={`Background Slot ${i} 🖼️`}
        imageWidth={336}
        imageHeight={336}
      />
    );
  }

  return (
    <Page>
      <Section title={<Text bold align="center">Photo Clock Preferences</Text>}>

        <Select
          settingsKey="clockMode"
          label="Clock mode 🕒"
          options={[
            { name: "24 hour", value: "24hour" },
            { name: "12 hour", value: "12hour" },
            { name: "Analog", value: "analog" }
          ]}
        />
        <Toggle
          settingsKey="date"
          label="Add date 📆"
        />
        <Toggle
          settingsKey="second"
          label="Have seconds on the clock ⌚"
        />
                <Toggle
          settingsKey="c"
          label="Do celsius 🌡️"
        />

                        <Toggle
          settingsKey="km"
          label="Use Kilometers 🗺️"
        />


        {slots}



        <Button
          label="Add Another Image Slot ➕"
          onClick={() => {
            if (bgCount < 10) {
              props.settingsStorage.setItem(
                "bgCount",
                JSON.stringify(bgCount + 1)
              );
            }
          }}
        />

        <Button
          label="Reset Slots ❌"
          type="secondary"
          onClick={() => {
            props.settingsStorage.setItem("bgCount", JSON.stringify(1));
            for (let i = 2; i <= 10; i++) {
              props.settingsStorage.removeItem(`bg_image_${i}`);
            }
          }}
        />

      </Section>
    </Page>
  );
}

registerSettingsPage(mySettings);
