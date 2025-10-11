# AI Agent API Documentation

This document describes how to integrate an AI Agent with the order creation system.

## Overview

The AI Agent can create orders directly in the platform using a secure Edge Function API. Orders created by the AI Agent are automatically tracked and can trigger invoice generation upon completion.

## Authentication

All requests must include an API key in the `X-API-Key` header.

```
X-API-Key: your-api-key-here
```

**Important:** You need to set the `AI_AGENT_API_KEY` environment variable in your Supabase project.

## Endpoints

### Create Order

**Endpoint:** `POST /functions/v1/ai-agent-create-order`

**Headers:**
```
Content-Type: application/json
X-API-Key: your-api-key-here
```

**Request Body:**
```json
{
  "client_email": "client@example.com",
  "client_name": "John Doe",
  "client_phone": "+1234567890",
  "service_type": "Residential Cleaning",
  "service_address": "123 Main St, Tampa, FL 33601",
  "service_date": "2025-10-15T10:00:00Z",
  "service_time": "10:00 AM - 12:00 PM",
  "items": [
    {
      "service_name": "Deep Cleaning",
      "description": "Full house deep cleaning including all rooms",
      "quantity": 1,
      "unit_price": 150.00
    },
    {
      "service_name": "Window Cleaning",
      "description": "Interior and exterior window cleaning",
      "quantity": 10,
      "unit_price": 5.00
    }
  ],
  "special_instructions": "Please bring eco-friendly cleaning products",
  "agent_session_id": "session-12345"
}
```

**Field Descriptions:**

- `client_email` (required): Client's email address. If the client doesn't exist, a new account will be created.
- `client_name` (required): Client's full name
- `client_phone` (optional): Client's phone number
- `service_type` (required): Type of service (e.g., "Residential Cleaning", "Commercial Cleaning")
- `service_address` (required): Full address where service will be performed
- `service_date` (required): ISO 8601 formatted date/time for the service
- `service_time` (required): Human-readable time slot (e.g., "10:00 AM - 12:00 PM")
- `items` (required): Array of service items
  - `service_name` (required): Name of the service
  - `description` (optional): Detailed description
  - `quantity` (required): Quantity (must be > 0)
  - `unit_price` (required): Price per unit (must be >= 0)
- `special_instructions` (optional): Any special notes or instructions from the client
- `agent_session_id` (optional): Your AI agent's session identifier for tracking

**Response (Success):**
```json
{
  "success": true,
  "order": {
    "id": "uuid",
    "client_id": "uuid",
    "service_type": "Residential Cleaning",
    "service_address": "123 Main St, Tampa, FL 33601",
    "service_date": "2025-10-15T10:00:00Z",
    "service_time": "10:00 AM - 12:00 PM",
    "status": "pending",
    "total_amount": 200.00,
    "payment_status": "unpaid",
    "created_by_agent": true,
    "agent_session_id": "session-12345",
    "order_items": [
      {
        "id": "uuid",
        "service_name": "Deep Cleaning",
        "description": "Full house deep cleaning including all rooms",
        "quantity": 1,
        "unit_price": 150.00,
        "subtotal": 150.00
      },
      {
        "id": "uuid",
        "service_name": "Window Cleaning",
        "description": "Interior and exterior window cleaning",
        "quantity": 10,
        "unit_price": 5.00,
        "subtotal": 50.00
      }
    ],
    "created_at": "2025-10-11T19:00:00Z"
  },
  "message": "Order created successfully"
}
```

**Response (Error):**
```json
{
  "error": "Error message here"
}
```

**Status Codes:**
- `200`: Success
- `400`: Bad request (missing required fields)
- `401`: Unauthorized (invalid API key)
- `500`: Internal server error

## Usage Examples

### cURL

```bash
curl -X POST https://your-project.supabase.co/functions/v1/ai-agent-create-order \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{
    "client_email": "client@example.com",
    "client_name": "John Doe",
    "service_type": "Residential Cleaning",
    "service_address": "123 Main St, Tampa, FL 33601",
    "service_date": "2025-10-15T10:00:00Z",
    "service_time": "10:00 AM - 12:00 PM",
    "items": [
      {
        "service_name": "Deep Cleaning",
        "quantity": 1,
        "unit_price": 150.00
      }
    ]
  }'
```

### JavaScript/TypeScript

```typescript
const response = await fetch(
  'https://your-project.supabase.co/functions/v1/ai-agent-create-order',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'your-api-key-here',
    },
    body: JSON.stringify({
      client_email: 'client@example.com',
      client_name: 'John Doe',
      service_type: 'Residential Cleaning',
      service_address: '123 Main St, Tampa, FL 33601',
      service_date: '2025-10-15T10:00:00Z',
      service_time: '10:00 AM - 12:00 PM',
      items: [
        {
          service_name: 'Deep Cleaning',
          quantity: 1,
          unit_price: 150.0,
        },
      ],
    }),
  }
);

const data = await response.json();
console.log(data);
```

### Python

```python
import requests
import json

url = "https://your-project.supabase.co/functions/v1/ai-agent-create-order"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "your-api-key-here"
}
data = {
    "client_email": "client@example.com",
    "client_name": "John Doe",
    "service_type": "Residential Cleaning",
    "service_address": "123 Main St, Tampa, FL 33601",
    "service_date": "2025-10-15T10:00:00Z",
    "service_time": "10:00 AM - 12:00 PM",
    "items": [
        {
            "service_name": "Deep Cleaning",
            "quantity": 1,
            "unit_price": 150.00
        }
    ]
}

response = requests.post(url, headers=headers, json=data)
print(response.json())
```

## Order Lifecycle

1. **Creation**: AI Agent creates order via API
2. **Confirmation**: Admin/employee confirms the order
3. **Assignment**: Admin assigns employee(s) to the order
4. **In Progress**: Employee marks order as in progress
5. **Completion**: Employee marks order as completed
6. **Invoice Generation**: Invoice is automatically generated
7. **Payment**: Client pays through Stripe integration

## Invoice Generation

When an order status changes to "completed", an invoice is automatically generated with:
- Unique invoice number (format: INV-YYYY-NNNN)
- All order items and pricing
- Tax calculation based on company settings
- 30-day payment terms by default

## Notes

- If a client email doesn't exist, a new user account is created automatically
- New clients receive an invitation email to set their password
- Orders created by AI Agent are marked with `created_by_agent: true`
- The `agent_session_id` helps track which AI session created the order
- Order totals are automatically calculated from items
- Notifications are sent to clients when orders are created

## Security

- Always keep your API key secure
- Use environment variables to store the API key
- Never commit API keys to version control
- The API key should be set in Supabase secrets as `AI_AGENT_API_KEY`
- Consider rotating API keys periodically

## Support

For issues or questions about the AI Agent API, contact the development team.
