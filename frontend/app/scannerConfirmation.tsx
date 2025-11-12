import * as React from "react";
import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import PopupForm from "./PopupForm";
import { API_URL, retrieveValue } from "./util";

type GetCategoriesResponse = {
  categories: Array<string>
}

type Template = {
  id: string,
  name: string,
  amount: number,
  unit: string,
  shelfLifeDays: number,
  category: string
};

export default function ConfirmationScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Array<{name: string, weight: string, qty: number, exp: Date, category: string}>>([
    { name: "Chicken Breast", weight: "300g", qty: 3, exp: new Date(), category: "Protein" },
  ]);

  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState<Array<{label: string, value: string}>>([]);

  const [templates, setTemplates] = useState<Array<Template>>([])
  const updateTemplates = async () => {
    type TemplatesResponse = {
      success: "success",
      status: 200,
      payload: Array<
        {
          templateId: string,
          template: {
            name: string,
            amount: number,
            unit: string,
            shelfLifeDays: number,
            category: string
          };
        }
      >
    };

    const token = await retrieveValue("jwt")
    if (!token) {
      console.error("No authentication token found")
      return
    }

    const response = await fetch(`${API_URL}/get-food-item-templates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const body: TemplatesResponse = await response.json();

    if (response.ok && body.success === "success") {
      const payload = body.payload;
      
      setTemplates(payload.map(value => {
        let template = value.template as Template;
        template['id'] = value.templateId;

        return template as Template;
      }));
    }
  };

  useEffect(() => {
    updateTemplates();
  }, [])

  const updateDropdownOptions = async () => {
    const token = await retrieveValue("jwt")
    if (!token) {
      console.error("No authentication token found")
      return
    }

    const response = await fetch(`${API_URL}/get-categories`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const body = await response.json();

    if (response.ok && body.success === "success") {
      const payload: GetCategoriesResponse = body.payload;
      setDropdownOptions(
        payload.categories.map(v => ({
          label: v,
          value: v
        }))
      );
    }
  };

  const saveItems = async () => {
    const token = await retrieveValue("jwt")
    if (!token) {
      console.error("No authentication token found")
      return
    }

    let addItems: Array<{ templateId: string, amount: number, unitPrice: number}> = [];

    outer: for (const item of items) {
      for (const template of templates) {
        if (item.name === template.name) {
          addItems.push({templateId: template.id, amount: item.qty, unitPrice: 0});
          continue outer;
        }
      }

      const ms = item.exp.getTime() - new Date().getTime(); 

      // Add template
      const newTemplate = {
        name: item.name,
        amount: item.qty,
        unit: "None",
        shelfLifeDays: Math.trunc(ms / 1000),
        category: item.category
      }

      const response = await fetch(`${API_URL}/create-food-item-template`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTemplate)
      });

      const body = await response.json();

      if (!response.ok || body.success === "fail") {
        console.error(body);
        break;
      }

      addItems.push({templateId: body.payload.templateId, amount: item.qty, unitPrice: 0});
    }

    const response = await fetch(`${API_URL}/add-food-items`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: addItems
      })
    });

    const body = await response.json();

    if (!response.ok || body.success === "fail")
      throw body;
  }

  useEffect(() => {
    updateDropdownOptions();
  }, []);

  const handleAddItem = (data: {
    dropdown: string | string;
    text: string;
    number1: number;
    number2: number;
    date?: Date | null;
  }) => {
    const newItem = {
      name: data.text || (data.dropdown ? String(data.dropdown) : "New Item"),
      weight: data.number1 ? `${data.number1}g` : "-",
      qty: data.number2 ? data.number2 : 0,
      exp: data.date ? data.date! : new Date(),
      category: data.dropdown
    };
    setItems((prev) => [...prev, newItem]);

/*
  const addItem = () => {
    // Add a blank new row when "+" is pressed
    setItems([
      ...items,
      { name: "New Item", weight: "-", qty: "-", exp: "-" },
    ]);
*/
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/(tabs)/scanner")}
        >
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Confirmation</Text>
      </View>

      {/* Middle Section (Soft Green) */}
      <View style={styles.content}>
        <View style={styles.tableHeader}>
          <Text style={styles.headerCell}>Name</Text>
          <Text style={styles.headerCell}>Weight</Text>
          <Text style={styles.headerCell}>Qty</Text>
          <Text style={styles.headerCell}>Exp Date</Text>
        </View>

        {items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.tableCell}>{item.name}</Text>
            <Text style={styles.tableCell}>{item.weight}</Text>
            <Text style={styles.tableCell}>{item.qty}</Text>
            <Text style={styles.tableCell}>{item.exp ? item.exp.toLocaleDateString() : ""}</Text>
          </View>
        ))}

        {/* + Button */}
        <TouchableOpacity onPress={() =>
          //() => router.push("/PopupForm")
          setIsPopupVisible(true)
      
          }>
          <Text style={styles.plusSign}>＋</Text>
        </TouchableOpacity>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton}
        onPress={() => {
          saveItems();
          router.push("/(tabs)/home");
        }}
        >
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom White Section */}
      <View style={styles.bottomWhite} />
      <PopupForm
        visible={isPopupVisible}
        onClose={() => setIsPopupVisible(false)}
        onSave={(data) => handleAddItem(data)}
        /*
        onSubmit={(data) => {
          handleAddItem(data);      // add the returned data to the table
          setIsPopupVisible(false); // close the popup
        }}
          */
        dropdownOptions={dropdownOptions}
        //title="Add Item"
      />
    </View>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF", // White top
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "#D6EAD8",
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    position: "absolute",
    left: 16,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  content: {
    flex: 1,
    backgroundColor: "#E8F3E8", // soft green
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginTop: 10,
    marginBottom: 10,
    padding: 16,
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#D6EAD8",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  headerCell: {
    fontWeight: "600",
    fontSize: 14,
    flex: 1,
    textAlign: "center",
    color: "#2E4E3F",
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  tableCell: {
    flex: 1,
    textAlign: "center",
    color: "#333",
    fontSize: 14,
  },
  plusSign: {
    textAlign: "center",
    fontSize: 26,
    color: "#2E4E3F",
    marginVertical: 12,
  },
  saveButton: {
    alignSelf: "center",
    backgroundColor: "#F59A73",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 40,
    marginTop: "auto",
  },
  saveText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  bottomWhite: {
    height: 40,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});
